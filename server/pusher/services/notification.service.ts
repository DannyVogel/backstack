import type { H3Event } from 'nitro/h3'
import type { NotificationResult } from '../types/notification-result'
import { removeSubscriptionByEndpoint, removeSubscriptions } from '~/server/database/methods/subscriptions'
import { logger } from '~/server/logger/logger'
import { NotificationResultProcessor } from './result-processor.service'
import { SubscriptionLookupService } from './subscription.service'
import { WebPushSender } from './webpush.service'

export class NotificationService {
  private subscriptionService: SubscriptionLookupService
  private webPushSender: WebPushSender
  private resultProcessor: NotificationResultProcessor

  constructor() {
    this.subscriptionService = new SubscriptionLookupService()
    this.webPushSender = new WebPushSender()
    this.resultProcessor = new NotificationResultProcessor()
  }

  async sendToDevice(
    event: H3Event,
    deviceId: string,
    payload: Record<string, any>,
  ): Promise<NotificationResult> {
    // Find subscription first (outside try-catch for webpush)
    const deviceSubscription = this.subscriptionService.getDeviceSubscription(event, deviceId)

    if (!deviceSubscription) {
      await logger.warn(
        event,
        `Subscription not found for device ${deviceId}`,
        {
          source: 'pusher',
          metadata: { device_id: deviceId },
        },
      )
      return {
        device_id: deviceId,
        success: false,
        error: 'Subscription not found',
      }
    }

    // Check if subscription has expired
    if (deviceSubscription.expiration_time) {
      const expirationDate = new Date(deviceSubscription.expiration_time)
      if (expirationDate < new Date()) {
        // Remove expired subscription
        removeSubscriptions(event, [deviceId])
        await logger.info(
          event,
          `Subscription expired for device ${deviceId}, removed`,
          {
            source: 'pusher',
            metadata: {
              device_id: deviceId,
              expiration_time: deviceSubscription.expiration_time,
            },
          },
        )
        return {
          device_id: deviceId,
          success: false,
          error: 'Subscription expired (removed)',
        }
      }
    }

    // Build subscription info for webpush
    const subscriptionInfo = {
      endpoint: deviceSubscription.endpoint,
      keys: deviceSubscription.keys,
    }

    try {
      // Send notification
      await this.webPushSender.sendNotification(subscriptionInfo, payload)

      return {
        device_id: deviceId,
        success: true,
      }
    }
    catch (error: any) {
      // Check if subscription is gone (410) or invalid (404)
      // These indicate the subscription should be removed
      const statusCode = error.statusCode || error.status
      if (statusCode === 410 || statusCode === 404) {
        // Clean up the stale subscription
        const removed = removeSubscriptionByEndpoint(subscriptionInfo.endpoint)
        await logger.info(
          event,
          `Subscription expired/invalid for device ${deviceId}, cleaned up: ${removed}`,
          {
            source: 'pusher',
            metadata: {
              device_id: deviceId,
              status_code: statusCode,
              endpoint_removed: removed,
            },
          },
        )
        return {
          device_id: deviceId,
          success: false,
          error: 'Subscription expired or invalid (removed)',
        }
      }

      await logger.error(
        event,
        `Web push failed for device ${deviceId}: ${error.message}`,
        {
          source: 'pusher',
          metadata: {
            error_type: error.constructor.name,
            device_id: deviceId,
            error_details: error.message,
            status_code: statusCode,
          },
        },
      )
      return {
        device_id: deviceId,
        success: false,
        error: `Web push failed: ${error.message}`,
      }
    }
  }

  async sendBatchNotifications(
    event: H3Event,
    deviceIds: string[],
    payload: Record<string, any>,
  ): Promise<{
    results: Array<{
      device_id: string
      success: boolean
      error?: string
    }>
    summary: {
      total: number
      successful: number
      failed: number
    }
  }> {
    await logger.info(
      event,
      `Processing batch notification for ${deviceIds.length} devices`,
      {
        source: 'pusher',
        metadata: {
          device_count: deviceIds.length,
        },
      },
    )

    // Send to all devices in parallel
    const results = await Promise.all(
      deviceIds.map(deviceId => this.sendToDevice(event, deviceId, payload)),
    )

    // Add all results to processor
    for (const result of results) {
      this.resultProcessor.addResult(result)
    }

    // Log final results
    const [total, successful, failed] = this.resultProcessor.getSummary()
    await logger.info(
      event,
      `Batch notification completed: ${successful} successful, ${failed} failed`,
      {
        source: 'pusher',
        metadata: {
          total_devices: total,
          successful_count: successful,
          failed_count: failed,
        },
      },
    )

    return this.resultProcessor.getResponseData()
  }

  getStatusCodeAndMessage(): [number, string] {
    return this.resultProcessor.getStatusCodeAndMessage()
  }
}
