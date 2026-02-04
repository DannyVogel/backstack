import type { H3Event } from 'nitro/h3'
import { HTTPError } from 'h3'
import { defineHandler, getQuery } from 'nitro/h3'
import { getLogStats } from '~/server/database/methods/logs'
import { logger } from '~/server/logger/logger'

export default defineHandler(async (event: H3Event) => {
  try {
    const query = getQuery(event)
    if (!query) {
      throw HTTPError.status(400, 'Bad Request: No query provided')
    }
    const hours = query.hours ? Number.parseInt(query.hours as string) : 24

    const stats = getLogStats(event, hours)

    return stats
  }
  catch (error: any) {
    await logger.error(event, `Failed to get log stats: ${error.message}`, {
      source: 'logger',
    })

    if (error.statusCode || error.status) {
      throw error
    }

    throw HTTPError.status(500, 'Failed to get log statistics')
  }
})
