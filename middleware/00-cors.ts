import type { H3Event } from 'nitro/deps/h3'
import { defineEventHandler } from 'nitro/h3'
import { corsConfig } from '~/server/config/cors'

/**
 * Global CORS middleware.
 *
 * This replaces the static CORS headers in nitro.config.ts with
 * dynamic origin validation based on NITRO_ALLOWED_ORIGINS.
 *
 * Naming starts with 00- to ensure it runs before other middleware.
 */
export default defineEventHandler((event: H3Event) => {
  const origin = event.headers.get('origin')
  const headers = corsConfig.getHeaders(origin)

  // Set CORS headers
  for (const [key, value] of Object.entries(headers)) {
    if (value) {
      event.res.headers.set(key, value)
    }
  }

  // Handle preflight requests
  if (event.req.method === 'OPTIONS') {
    event.res.status = 204
    return ''
  }

  // Continue to next handler
  return undefined
})
