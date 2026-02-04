import type { H3Event } from 'nitro/h3'
import type { LogEntry, LogResponse } from '~/server/logger/types'
import { HTTPError } from 'h3'
import { defineHandler, readBody } from 'nitro/h3'
import { addLog } from '~/server/database/methods/logs'
import { logger } from '~/server/logger/logger'

export default defineHandler(async (event: H3Event): Promise<LogResponse> => {
  try {
    const body = await readBody<LogEntry>(event)
    if (!body) {
      throw HTTPError.status(400, 'Bad Request: No body provided')
    }

    // Validate required fields
    if (!body.level || !body.message || !body.source) {
      throw HTTPError.status(400, 'Bad Request: Missing required fields (level, message, source)')
    }

    // Extract client information from request
    const clientIp = event.headers.get('x-forwarded-for')
      || event.headers.get('x-real-ip')
      || null
    const userAgent = event.headers.get('user-agent') || null

    // Override with request data if not provided
    const logEntry: LogEntry = {
      level: body.level,
      message: body.message,
      source: body.source,
      client_id: body.client_id || null,
      user_agent: body.user_agent || userAgent,
      ip_address: body.ip_address || clientIp,
      metadata: body.metadata || null,
      timestamp: body.timestamp || new Date().toISOString(),
    }

    // Log the entry
    const logId = addLog(event, logEntry)

    return {
      success: true,
      log_id: logId,
      message: 'Log entry created successfully',
    }
  }
  catch (error: any) {
    // Fallback logging to console if database fails
    await logger.error(event, `Failed to create log entry: ${error.message}`, {
      source: 'logger',
    })

    if (error.statusCode || error.status) {
      throw error
    }

    throw HTTPError.status(500, 'Failed to create log entry')
  }
})
