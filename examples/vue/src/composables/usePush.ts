import { ref, onMounted } from 'vue'

interface PushConfig {
  baseUrl: string
  vapidPublicKey: string
  apiKey?: string
}

function getDeviceId(): string {
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

export function usePush(config: PushConfig) {
  const isSupported = ref(false)
  const isSubscribed = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  onMounted(async () => {
    isSupported.value = 'serviceWorker' in navigator && 'PushManager' in window

    if (isSupported.value) {
      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        isSubscribed.value = subscription !== null
      } catch {
        isSubscribed.value = false
      }
    }
  })

  async function subscribe() {
    if (!isSupported.value) {
      error.value = 'Push notifications not supported'
      return
    }

    isLoading.value = true
    error.value = null

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
            keys: subscriptionJson.keys
          }
        })
      })

      if (!response.ok) {
        throw new Error('Subscription failed')
      }

      isSubscribed.value = true
    } catch (err: any) {
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  async function unsubscribe() {
    isLoading.value = true
    error.value = null

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
      isSubscribed.value = false
    } catch (err: any) {
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  return {
    isSupported,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe
  }
}
