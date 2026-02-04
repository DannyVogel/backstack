import type { H3Event } from 'nitro/deps/h3'
import type { LogLevel, LogSource } from '~/server/logger/types'
import { HTTPError } from 'h3'
import { defineHandler, getQuery } from 'nitro/h3'
import { getLogs } from '~/server/database/methods/logs'
import { logger } from '~/server/logger/logger'

export default defineHandler(async (event: H3Event) => {
  try {
    const query = getQuery(event)

    const level = query.level as LogLevel | undefined
    const source = query.source as LogSource | undefined
    const clientId = query.client_id as string | undefined
    const hours = query.hours ? Number.parseInt(query.hours as string) : 24
    const limit = query.limit ? Number.parseInt(query.limit as string) : 100

    const logs = getLogs(event, {
      level,
      source,
      client_id: clientId,
      hours,
      limit,
    })

    return logs
  }
  catch (error: any) {
    await logger.error(event, `Failed to retrieve logs: ${error.message}`, {
      source: 'logger',
    })

    if (error.statusCode || error.status) {
      throw error
    }

    throw HTTPError.status(500, 'Failed to retrieve logs')
  }
})
