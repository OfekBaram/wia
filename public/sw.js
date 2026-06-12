// WIA service worker — web push only (no caching/offline logic).

self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data?.json() ?? {} } catch { /* ignore */ }
  const title = data.title || 'WIA'
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      tag:  data.tag || undefined,
      icon: '/icon.svg',
      badge: '/icon.svg',
      data: { url: data.url || '/' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if (new URL(w.url).pathname === new URL(url, self.location.origin).pathname) {
          return w.focus()
        }
      }
      return clients.openWindow(url)
    }),
  )
})
