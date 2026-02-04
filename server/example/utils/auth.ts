import type { H3Event } from 'nitro/deps/h3'
import { HTTPError } from 'h3'
import { corsConfig } from '~/server/config/cors'
import { secureCompare } from '~/server/utils/secure-compare'

const exampleApiKey = process.env.NITRO_EXAMPLE_API_KEY || ''

export function verifyExampleApiKey(event: H3Event): void {
  // If no API key configured, allow all requests (development mode)
  if (!exampleApiKey) {
    return
  }

  const requestApiKey = event.headers.get('x-api-key')
  const origin = event.headers.get('origin')

  if (secureCompare(requestApiKey, exampleApiKey)) {
    return
  }

  // Also allow requests from configured CORS origins
  if (corsConfig.isOriginAllowed(origin)) {
    return
  }

  throw HTTPError.status(403, 'Forbidden: Invalid API key')
}
