# Push Notification Service

Send web push notifications to subscribed devices.

## Overview

The Pusher service implements the Web Push Protocol for sending notifications to browsers and PWAs.

## Configuration

```env
NITRO_PUSHER_API_KEY=your_api_key
NITRO_VAPID_PRIVATE_KEY=your_private_key
NITRO_VAPID_PUBLIC_KEY=your_public_key
NITRO_VAPID_EMAIL=your@email.com
```

### Generate VAPID Keys

```bash
npx web-push generate-vapid-keys
```

## API Endpoints

### Subscribe

`POST /pusher/subscribe`

Subscribe a device to push notifications.

**Request:**
```json
{
  "device_id": "unique-device-id",
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": {
      "p256dh": "base64-encoded-key",
      "auth": "base64-encoded-key"
    },
    "expiration_time": null,
    "metadata": {}
  }
}
```

**Response:**
```json
{
  "status_code": 201,
  "message": "Subscribed successfully",
  "data": {
    "endpoint": "...",
    "device_id": "unique-device-id"
  }
}
```

### Unsubscribe

`POST /pusher/unsubscribe`

Remove device subscriptions.

**Request:**
```json
{
  "device_ids": ["device-1", "device-2"]
}
```

### Notify

`POST /pusher/notify`

Send notifications to devices.

**Request:**
```json
{
  "device_ids": ["device-1", "device-2"],
  "payload": {
    "title": "Hello!",
    "body": "You have a new message",
    "icon": "/icon.png",
    "data": {
      "url": "/messages"
    }
  }
}
```

**Response Codes:**
- `200` - All notifications sent
- `207` - Partial success
- `500` - All failed

## Client Integration

### Service Worker

Create `sw.js`:

```javascript
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {}

  const options = {
    body: data.body,
    icon: data.icon || '/icon.png',
    badge: data.badge,
    data: data.data || {},
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Notification', options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(clients.openWindow(url))
})
```

### Subscribe to Notifications

```javascript
async function subscribe(vapidPublicKey, apiKey, baseUrl) {
  // Register service worker
  const registration = await navigator.serviceWorker.register('/sw.js')

  // Request permission
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return

  // Subscribe
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
  })

  // Send to server
  const response = await fetch(`${baseUrl}/pusher/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey
    },
    body: JSON.stringify({
      device_id: getDeviceId(),
      subscription: subscription.toJSON()
    })
  })

  return response.json()
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

function getDeviceId() {
  let id = localStorage.getItem('device_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('device_id', id)
  }
  return id
}
```

## Database Schema

```sql
CREATE TABLE subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  endpoint TEXT UNIQUE NOT NULL,
  keys TEXT NOT NULL,
  device_id TEXT NOT NULL,
  expiration_time TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

## Error Handling

Common errors:

- `400` - Invalid subscription keys
- `403` - Invalid API key
- `404` - Subscription not found
- `410` - Subscription expired (auto-removed)
