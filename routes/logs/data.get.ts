import type { H3Event } from 'nitro/deps/h3'
import type { LogLevel, LogSource } from '~/server/logger/types'
import { getCookie } from 'h3'
import { defineHandler, getQuery } from 'nitro/h3'
import { loggerConfig } from '~/server/config/logger'
import { getLogs } from '~/server/database/methods/logs'
import { verifyViewerApiKey } from '~/server/logger/utils/viewer-auth'
import { secureCompare } from '~/server/utils/secure-compare'

export default defineHandler(async (event: H3Event) => {
  // Check session cookie first (set by /logs page)
  const sessionCookie = getCookie(event, 'log_viewer_session')
  const hasValidSession = secureCompare(sessionCookie, loggerConfig.viewerKey)

  // If no valid session, require API key in header or query
  if (!hasValidSession) {
    verifyViewerApiKey(event)
  }

  const query = getQuery(event)
  const level = query.level as LogLevel | undefined
  const source = query.source as LogSource | undefined
  const hours = query.hours ? Number.parseInt(query.hours as string) : 24
  const search = query.search as string | undefined

  try {
    const logs = getLogs(event, {
      level,
      source,
      hours,
      search,
      limit: 1000,
    })
    return { logs }
  }
  catch (error: any) {
    return { error: error.message }
  }
})
