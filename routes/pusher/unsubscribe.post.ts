import type { H3Event } from 'nitro/deps/h3'
import type { UnsubscribeRequest } from '~/server/pusher/types/subscription'
import { HTTPError } from 'h3'
import { defineHandler, readBody } from 'nitro/h3'
import { removeSubscriptions } from '~/server/database/methods/subscriptions'
import { logger } from '~/server/logger/logger'
import { successResponse } from '~/server/pusher/utils/response'

export default defineHandler(async (event: H3Event) => {
  try {
    const body = await readBody<UnsubscribeRequest>(event)
    if (!body) {
      throw HTTPError.status(400, 'Bad Request: No body provided')
    }

    const result = removeSubscriptions(event, body.device_ids)

    if (result.length === 0) {
      await logger.warn(
        event,
        'Unsubscribe failed: no subscriptions found for provided device IDs',
        {
          source: 'pusher',
          metadata: { device_ids: body.device_ids },
        },
      )
      throw HTTPError.status(404, 'No subscriptions found for provided device IDs')
    }

    await logger.info(
      event,
      `Batch unsubscribe successful: removed ${result.length} subscriptions`,
      {
        source: 'pusher',
        metadata: {
          device_ids: body.device_ids,
          removed_count: result.length,
        },
      },
    )

    return successResponse(
      {
        device_ids: body.device_ids,
        removed_count: result.length,
        removed_subscriptions: result,
      },
      `Successfully unsubscribed ${result.length} devices`,
      200,
    )
  }
  catch (error: any) {
    if (error.statusCode || error.status) {
      throw error
    }

    await logger.error(
      event,
      `Batch unsubscribe failed: ${error.message}`,
      {
        source: 'pusher',
        metadata: {
          error_type: error.constructor?.name || 'Unknown',
          error_details: error.message,
        },
      },
    )

    throw HTTPError.status(500, `Batch unsubscribe failed: ${error.message}`)
  }
})
