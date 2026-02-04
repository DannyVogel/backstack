export type NotificationDirection = 'auto' | 'ltr' | 'rtl'

export interface NotificationAction {
  action: string
  title: string
  icon?: string
}

export interface NotificationData {
  url?: string
  [key: string]: any
}

export interface NotificationPayload {
  title: string
  body?: string
  icon?: string
  badge?: string
  image?: string
  tag?: string
  requireInteraction?: boolean
  silent?: boolean
  renotify?: boolean
  actions?: NotificationAction[]
  timestamp?: number
  vibrate?: number | number[]
  lang?: string
  dir?: NotificationDirection
  data?: NotificationData
}

export interface NotificationRequest {
  payload: NotificationPayload
  device_ids: string[]
}
