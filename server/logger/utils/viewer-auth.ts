import type { H3Event } from 'nitro/h3'
import { getQuery, HTTPError } from 'h3'
import { loggerConfig } from '~/server/config/logger'
import { secureCompare } from '~/server/utils/secure-compare'

export function verifyViewerApiKey(event: H3Event): void {
  const viewerKey = loggerConfig.viewerKey

  if (!viewerKey) {
    throw HTTPError.status(500, 'Log viewer not configured')
  }

  const query = getQuery(event)
  const apiKey = (query.api_key as string) || event.headers.get('x-api-key')

  if (secureCompare(apiKey, viewerKey)) {
    return
  }

  throw HTTPError.status(403, 'Forbidden: Invalid API key for log viewer')
}
