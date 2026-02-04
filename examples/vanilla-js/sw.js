// Service Worker for Push Notifications
/* eslint-disable no-restricted-globals, no-undef */

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}

  const options = {
    body: data.body || '',
    icon: data.icon || '/icon.png',
    badge: data.badge,
    image: data.image,
    tag: data.tag,
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    data: data.data || {},
    actions: data.actions || [],
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Notification', options),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const data = event.notification.data || {}
  const url = data.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    }),
  )
})

self.addEventListener('notificationclose', (event) => {
  // Track notification dismissals if needed
  console.log('Notification closed:', event.notification.tag)
})
