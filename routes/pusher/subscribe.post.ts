import type { H3Event } from 'nitro/h3'
import type { SubscriptionRequest } from '~/server/pusher/types/subscription'
import { HTTPError } from 'h3'
import { defineHandler, readBody } from 'nitro/h3'
import { addSubscription } from '~/server/database/methods/subscriptions'
import { logger } from '~/server/logger/logger'
import { validateSubscriptionKeys } from '~/server/pusher/utils/key-validation'
import { successResponse } from '~/server/pusher/utils/response'

export default defineHandler(async (event: H3Event) => {
  try {
    const body = await readBody<SubscriptionRequest>(event)
    if (!body) {
      throw HTTPError.status(400, 'Bad Request: No body provided')
    }
    validateSubscriptionKeys(body.subscription.keys)

    const result = addSubscription(event, {
      endpoint: body.subscription.endpoint,
      keys: body.subscription.keys,
      device_id: body.device_id,
      expiration_time: body.subscription.expiration_time || null,
      metadata: body.subscription.metadata || null,
    })

    await logger.info(
      event,
      'Subscription successful',
      {
        source: 'pusher',
        metadata: {
          endpoint: result[0]?.endpoint || body.subscription.endpoint,
          device_id: body.device_id,
          result_count: result.length,
        },
      },
    )

    return successResponse(
      {
        endpoint: result[0]?.endpoint || body.subscription.endpoint,
        device_id: body.device_id,
      },
      'Subscribed successfully',
      201,
    )
  }
  catch (error: any) {
    await logger.error(
      event,
      `Subscription failed: ${error.message}`,
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

    // Check if it's a validation error (from validateSubscriptionKeys)
    if (error.message.includes('key must') || error.message.includes('Keys must') || error.message.includes('Invalid base64url')) {
      throw HTTPError.status(400, `Invalid subscription keys: ${error.message}`)
    }

    throw HTTPError.status(500, `Subscription failed: ${error.message}`)
  }
})
