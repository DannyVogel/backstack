import type { H3Event } from 'nitro/h3'
import { HTTPError } from 'h3'

interface RateLimitEntry {
  count: number
  resetAt: number
  failedAttempts: number
  blockedUntil: number | null
}

interface RateLimiterOptions {
  /** Maximum requests per window */
  max: number
  /** Window size in milliseconds */
  windowMs: number
  /** Optional: block duration after max failed attempts (for auth endpoints) */
  blockDurationMs?: number
  /** Optional: number of failed attempts before blocking */
  maxFailedAttempts?: number
}

// In-memory store (consider Redis for production clusters)
const store = new Map<string, RateLimitEntry>()

// Cleanup old entries periodically
// Use unref() to allow the process to exit cleanly
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now && (!entry.blockedUntil || entry.blockedUntil < now)) {
      store.delete(key)
    }
  }
}, 60000).unref()

function getClientKey(event: H3Event, prefix: string): string {
  const ip = event.headers.get('x-forwarded-for')
    ?.split(',')[0]
    ?.trim()
    || event.headers.get('x-real-ip')
    || 'unknown'
  return `${prefix}:${ip}`
}

/**
 * Creates a rate limiter for a specific endpoint or group of endpoints.
 */
export function createRateLimiter(options: RateLimiterOptions) {
  const { max, windowMs, blockDurationMs, maxFailedAttempts } = options

  return {
    /**
     * Check rate limit. Throws HTTPError if limit exceeded.
     */
    check(event: H3Event, prefix: string): void {
      const key = getClientKey(event, prefix)
      const now = Date.now()
      let entry = store.get(key)

      // Check if blocked due to failed attempts
      if (entry?.blockedUntil && entry.blockedUntil > now) {
        const retryAfter = Math.ceil((entry.blockedUntil - now) / 1000)
        throw HTTPError.status(429, `Too many failed attempts. Try again in ${retryAfter} seconds.`)
      }

      // Reset if window expired
      if (!entry || entry.resetAt < now) {
        entry = {
          count: 0,
          resetAt: now + windowMs,
          failedAttempts: entry?.failedAttempts || 0,
          blockedUntil: null,
        }
      }

      entry.count++

      if (entry.count > max) {
        store.set(key, entry)
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
        throw HTTPError.status(429, `Rate limit exceeded. Try again in ${retryAfter} seconds.`)
      }

      store.set(key, entry)
    },

    /**
     * Record a failed attempt (for auth endpoints).
     * Can trigger blocking if maxFailedAttempts is configured.
     */
    recordFailure(event: H3Event, prefix: string): void {
      if (!maxFailedAttempts || !blockDurationMs)
        return

      const key = getClientKey(event, prefix)
      const now = Date.now()
      const entry = store.get(key) || {
        count: 0,
        resetAt: now + windowMs,
        failedAttempts: 0,
        blockedUntil: null,
      }

      entry.failedAttempts++

      if (entry.failedAttempts >= maxFailedAttempts) {
        entry.blockedUntil = now + blockDurationMs
        entry.failedAttempts = 0 // Reset counter after blocking
      }

      store.set(key, entry)
    },

    /**
     * Reset failed attempts (on successful auth).
     */
    resetFailures(event: H3Event, prefix: string): void {
      const key = getClientKey(event, prefix)
      const entry = store.get(key)
      if (entry) {
        entry.failedAttempts = 0
        entry.blockedUntil = null
        store.set(key, entry)
      }
    },
  }
}

// Pre-configured rate limiters for different endpoint types
export const rateLimiters = {
  /**
   * General API rate limiter: 100 requests per minute
   */
  api: createRateLimiter({
    max: 100,
    windowMs: 60000,
  }),

  /**
   * Auth endpoints: 10 attempts per minute, block for 15 min after 5 failures
   */
  auth: createRateLimiter({
    max: 10,
    windowMs: 60000,
    maxFailedAttempts: 5,
    blockDurationMs: 15 * 60 * 1000,
  }),

  /**
   * Log ingestion: Higher limit for legitimate logging
   */
  logging: createRateLimiter({
    max: 200,
    windowMs: 60000,
  }),
}
