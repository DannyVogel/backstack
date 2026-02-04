import type { H3Event } from 'nitro/deps/h3'
import { HTTPError } from 'h3'
import { corsConfig } from '~/server/config/cors'
import { pusherConfig } from '~/server/config/pusher'
import { logger } from '~/server/logger/logger'
import { secureCompare } from '~/server/utils/secure-compare'

export function verifyApiKey(event: H3Event): void {
  const apiKey = pusherConfig.apiKey

  if (!apiKey) {
    throw HTTPError.status(500, 'API key not configured')
  }

  const requestApiKey = event.headers.get('x-api-key')
  const origin = event.headers.get('origin')

  if (secureCompare(requestApiKey, apiKey)) {
    return
  }

  // Also allow requests from configured CORS origins (for browser clients)
  if (corsConfig.isOriginAllowed(origin)) {
    return
  }

  const clientIp = event.headers.get('x-forwarded-for')
    || event.headers.get('x-real-ip')
    || null
  const userAgent = event.headers.get('user-agent') || null

  logger.warn(event, 'Authentication failed: Invalid API key or origin not allowed', {
    source: 'system',
    userAgent,
    ipAddress: clientIp,
    metadata: {
      hasApiKey: !!requestApiKey,
      origin: origin || null,
      originAllowed: corsConfig.isOriginAllowed(origin),
    },
  })

  throw HTTPError.status(403, 'Forbidden: Invalid API key or origin not allowed')
}
