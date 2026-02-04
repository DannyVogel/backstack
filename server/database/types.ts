export interface SubscriptionKeys {
  p256dh: string
  auth: string
}

export interface SubscriptionRow {
  id?: number
  endpoint: string
  keys: SubscriptionKeys
  device_id: string
  expiration_time: string | null
  metadata: Record<string, any> | null
  created_at: string
}

export interface LogRow {
  id?: number
  level: string
  message: string
  source: string
  client_id: string | null
  user_agent: string | null
  ip_address: string | null
  metadata: Record<string, any> | null
  timestamp: string
}

export interface ExampleItemRow {
  id?: number
  title: string
  content: string | null
  created_at: string
  updated_at: string
}
