import type { H3Event } from 'nitro/deps/h3'
import type { NotificationResult } from '../types/notification-result'
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
    try {
      // Find subscription
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

      // Build subscription info for webpush
      const subscriptionInfo = {
        endpoint: deviceSubscription.endpoint,
        keys: deviceSubscription.keys,
      }

      // Send notification
      await this.webPushSender.sendNotification(subscriptionInfo, payload)

      return {
        device_id: deviceId,
        success: true,
      }
    }
    catch (error: any) {
      await logger.error(
        event,
        `Web push failed for device ${deviceId}: ${error.message}`,
        {
          source: 'pusher',
          metadata: {
            error_type: error.constructor.name,
            device_id: deviceId,
            error_details: error.message,
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

    // Send to each device
    for (const deviceId of deviceIds) {
      const result = await this.sendToDevice(event, deviceId, payload)
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
