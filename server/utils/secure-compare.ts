import { timingSafeEqual } from 'node:crypto'

/**
 * Timing-safe string comparison to prevent timing attacks.
 * Used for comparing API keys and other secrets.
 */
export function secureCompare(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) {
    return false
  }

  // If lengths differ, we still need to do a comparison to avoid timing leaks
  // that could reveal the length of the secret
  if (a.length !== b.length) {
    // Compare against itself to maintain constant time
    const bufferA = Buffer.from(a)
    timingSafeEqual(bufferA, bufferA)
    return false
  }

  return timingSafeEqual(Buffer.from(a), Buffer.from(b))
}
