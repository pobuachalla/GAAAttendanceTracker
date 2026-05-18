// Service Worker for GAA Attendance Tracker PWA
const CACHE_NAME = 'gaa-attendance-v1'
const OFFLINE_URL = '/offline'

const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/manifest.json',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {})
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  // Skip non-GET requests and API routes
  if (request.method !== 'GET') return
  if (request.url.includes('/api/')) return

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) return cached
          return new Response('Offline - please reconnect', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          })
        })
      })
  )
})
