export interface Keys {
  p256dh: string
  auth: string
}

export interface Subscription {
  endpoint: string
  keys: Keys
  expiration_time?: string | null
  metadata?: Record<string, any> | null
}

export interface SubscriptionRequest {
  subscription: Subscription
  device_id: string
}

export interface UnsubscribeRequest {
  device_ids: string[]
}
