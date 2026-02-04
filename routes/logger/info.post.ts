import type { H3Event } from 'nitro/h3'
import { HTTPError } from 'h3'
import { defineHandler, readBody } from 'nitro/h3'
import { addLog } from '~/server/database/methods/logs'
import { logger } from '~/server/logger/logger'

export default defineHandler(async (event: H3Event) => {
  try {
    const body = await readBody<{
      message: string
      client_id?: string
      metadata?: Record<string, any>
    }>(event)
    if (!body) {
      throw HTTPError.status(400, 'Bad Request: No body provided')
    }
    const clientIp = event.headers.get('x-forwarded-for')
      || event.headers.get('x-real-ip')
      || null
    const userAgent = event.headers.get('user-agent') || null

    const logId = addLog(event, {
      level: 'info',
      message: body.message,
      source: 'client',
      client_id: body.client_id || null,
      user_agent: userAgent,
      ip_address: clientIp,
      metadata: body.metadata || null,
    })

    return {
      success: true,
      log_id: logId,
      message: 'Info logged successfully',
    }
  }
  catch (error: any) {
    await logger.error(event, `Failed to log info: ${error.message}`, {
      source: 'logger',
    })

    if (error.statusCode || error.status) {
      throw error
    }

    throw HTTPError.status(500, 'Failed to log info')
  }
})
