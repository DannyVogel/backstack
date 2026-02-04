import webpush from 'web-push'
import { pusherConfig } from '~/server/config/pusher'
import { validateSubscriptionKeys } from '../utils/key-validation'

export class WebPushSender {
  private vapidPrivateKey: string
  private vapidPublicKey: string
  private vapidEmail: string

  constructor() {
    const vapidPrivateKey = pusherConfig.vapidPrivateKey
    const vapidPublicKey = pusherConfig.vapidPublicKey
    const vapidEmail = pusherConfig.vapidEmail

    if (!vapidPrivateKey || !vapidPublicKey || !vapidEmail) {
      throw new Error('VAPID keys or email not configured.')
    }

    this.vapidPrivateKey = vapidPrivateKey
    this.vapidPublicKey = vapidPublicKey
    this.vapidEmail = vapidEmail

    // Set VAPID details
    webpush.setVapidDetails(
      `mailto:${this.vapidEmail}`,
      this.vapidPublicKey,
      this.vapidPrivateKey,
    )
  }

  sendNotification(
    subscriptionInfo: {
      endpoint: string
      keys: {
        p256dh: string
        auth: string
      }
    },
    payload: Record<string, any>,
  ): Promise<void> {
    validateSubscriptionKeys(subscriptionInfo.keys)

    return webpush.sendNotification(
      subscriptionInfo,
      JSON.stringify(payload),
    )
  }
}
