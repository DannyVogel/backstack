import { useState, useCallback, useEffect } from 'react'

interface PushConfig {
  baseUrl: string
  vapidPublicKey: string
  apiKey?: string
}

interface UsePushNotificationsResult {
  isSupported: boolean
  isSubscribed: boolean
  isLoading: boolean
  error: string | null
  subscribe: () => Promise<void>
  unsubscribe: () => Promise<void>
}

function getDeviceId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('backstack_device_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('backstack_device_id', id)
  }
  return id
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export function usePushNotifications(config: PushConfig): UsePushNotificationsResult {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window
    setIsSupported(supported)

    if (supported) {
      checkSubscription()
    }
  }, [])

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(subscription !== null)
    } catch {
      setIsSubscribed(false)
    }
  }

  const subscribe = useCallback(async () => {
    if (!isSupported) {
      setError('Push notifications not supported')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        throw new Error('Permission denied')
      }

      const registration = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.vapidPublicKey)
      })

      const subscriptionJson = subscription.toJSON()

      const response = await fetch(`${config.baseUrl}/pusher/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey ? { 'X-API-Key': config.apiKey } : {})
        },
        body: JSON.stringify({
          device_id: getDeviceId(),
          subscription: {
            endpoint: subscriptionJson.endpoint,
            keys: subscriptionJson.keys,
            expiration_time: subscriptionJson.expirationTime
          }
        })
      })

      if (!response.ok) {
        throw new Error('Subscription failed')
      }

      setIsSubscribed(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [config, isSupported])

  const unsubscribe = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()
      }

      await fetch(`${config.baseUrl}/pusher/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey ? { 'X-API-Key': config.apiKey } : {})
        },
        body: JSON.stringify({
          device_ids: [getDeviceId()]
        })
      })

      localStorage.removeItem('backstack_device_id')
      setIsSubscribed(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [config])

  return {
    isSupported,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe
  }
}
