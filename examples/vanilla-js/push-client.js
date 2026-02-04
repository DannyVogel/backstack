/**
 * Push Notification Client for BackStack
 */
class PushNotificationClient {
  constructor(config) {
    this.baseUrl = config.baseUrl
    this.vapidPublicKey = config.vapidPublicKey
    this.apiKey = config.apiKey
    this.deviceId = this.getDeviceId()
  }

  getDeviceId() {
    let id = localStorage.getItem('backstack_device_id')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('backstack_device_id', id)
    }
    return id
  }

  isSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported')
    }
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      throw new Error('Permission denied')
    }
    return true
  }

  async registerServiceWorker() {
    const registration = await navigator.serviceWorker.register('/sw.js')
    return registration
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = atob(base64)
    return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
  }

  async subscribe() {
    if (!this.isSupported()) {
      throw new Error('Push notifications not supported')
    }

    await this.requestPermission()
    const registration = await this.registerServiceWorker()
    await navigator.serviceWorker.ready

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey),
    })

    const subscriptionJson = subscription.toJSON()

    const response = await fetch(`${this.baseUrl}/pusher/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { 'X-API-Key': this.apiKey } : {}),
      },
      body: JSON.stringify({
        device_id: this.deviceId,
        subscription: {
          endpoint: subscriptionJson.endpoint,
          keys: subscriptionJson.keys,
          expiration_time: subscriptionJson.expirationTime,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Subscription failed: ${response.statusText}`)
    }

    return response.json()
  }

  async unsubscribe() {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      await subscription.unsubscribe()
    }

    const response = await fetch(`${this.baseUrl}/pusher/unsubscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { 'X-API-Key': this.apiKey } : {}),
      },
      body: JSON.stringify({
        device_ids: [this.deviceId],
      }),
    })

    localStorage.removeItem('backstack_device_id')
    this.deviceId = null

    return response.json()
  }

  async isSubscribed() {
    if (!this.isSupported())
      return false
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    return subscription !== null
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PushNotificationClient
}
