import type { H3Event } from 'nitro/deps/h3'
import { getDeviceSubscription } from '~/server/database/methods/subscriptions'

export class SubscriptionLookupService {
  private subscriptionsCache: any[] | null = null

  getDeviceSubscription(
    event: H3Event,
    deviceId: string,
  ): any | null {
    // For now, we'll query directly from DB each time
    // In production, you might want to implement caching
    return getDeviceSubscription(event, deviceId)
  }
}
