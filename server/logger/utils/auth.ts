import type { H3Event } from 'nitro/h3'
import { HTTPError } from 'h3'
import { loggerConfig } from '~/server/config/logger'
import { logger } from '~/server/logger/logger'
import { secureCompare } from '~/server/utils/secure-compare'

export function verifyApiKey(event: H3Event): void {
  const apiKey = loggerConfig.apiKey

  if (!apiKey) {
    throw HTTPError.status(500, 'API key not configured')
  }

  const requestApiKey = event.headers.get('x-api-key')

  if (secureCompare(requestApiKey, apiKey)) {
    return
  }

  const clientIp
    = event.headers.get('x-forwarded-for')
      || event.headers.get('x-real-ip')
      || null
  const userAgent = event.headers.get('user-agent') || null

  logger.warn(event, 'Logger authentication failed: Invalid API key', {
    source: 'system',
    userAgent,
    ipAddress: clientIp,
    metadata: {
      hasApiKey: !!requestApiKey,
    },
  })

  throw HTTPError.status(403, 'Forbidden: Invalid API key')
}
