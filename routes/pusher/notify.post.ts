import type { H3Event } from 'nitro/deps/h3'
import type { NotificationRequest } from '~/server/pusher/types/notification'
import { HTTPError } from 'h3'
import { defineHandler, readBody } from 'nitro/h3'
import { logger } from '~/server/logger/logger'
import { NotificationService } from '~/server/pusher/services/notification.service'
import { successResponse } from '~/server/pusher/utils/response'

export default defineHandler(async (event: H3Event) => {
  try {
    const body = await readBody<NotificationRequest>(event)

    if (!body) {
      throw HTTPError.status(400, 'Bad Request: No body provided')
    }

    const notificationService = new NotificationService()
    const responseData = await notificationService.sendBatchNotifications(
      event,
      body.device_ids,
      body.payload,
    )

    const [statusCode, message] = notificationService.getStatusCodeAndMessage()

    return successResponse(responseData, message, statusCode)
  }
  catch (error: any) {
    await logger.error(
      event,
      `Batch notification failed: ${error.message}`,
      {
        source: 'pusher',
        metadata: {
          error_type: error.constructor?.name || 'Unknown',
          error_details: error.message,
        },
      },
    )

    if (error.statusCode || error.status) {
      throw error
    }

    throw HTTPError.status(500, `Batch notification failed: ${error.message}`)
  }
})
