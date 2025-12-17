/*
    Service Worker for Anime-Dimension
    - Caches static assets (css/js/images) with a cache-first strategy
    - Handles navigations with network-first and offline fallback
    - Lives at "/service-worker.js" to control the whole origin

    Note: This file is compiled and emitted to the site root by the build step.
*/

// Use a typed alias of the ServiceWorker global to avoid DOM vs Worker overload issues
const sw = self as unknown as ServiceWorkerGlobalScope

const VERSION = 'v1';
const STATIC_CACHE = `ad-static-${VERSION}`;
const PAGE_CACHE = `ad-pages-${VERSION}`;
const OFFLINE_URL = '/offline.html';

// Core assets we want available immediately when offline
const CORE_ASSETS = [
    OFFLINE_URL,
    '/css/main.min.css',
];

sw.addEventListener('install', (event: ExtendableEvent) => {
    sw.skipWaiting();
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => cache.addAll(CORE_ASSETS)).catch((error) => {
            // Ignore if some assets aren't available during dev
            console.warn('[SW] Install cache error:', error);
        }),
    );
});

sw.addEventListener('activate', (event: ExtendableEvent) => {
    sw.clients.claim();
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((k) => ![STATIC_CACHE, PAGE_CACHE].includes(k))
                    .map((k) => caches.delete(k)),
            ),
        ),
    );
});

// Helper: cache-first for static files
async function cacheFirst(request: Request): Promise<Response> {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(request);
    if (cached) {
        // Revalidate in background
        fetch(request)
            .then((res) => {
                if (res && res.ok) cache.put(request, res.clone());
            })
            .catch(() => {});
        return cached;
    }
    try {
        const res = await fetch(request);
        if (res && res.ok) await cache.put(request, res.clone());
        return res;
    } catch (error) {
        console.debug('[SW] cacheFirst failed:', error);
        return cached || new Response('Offline', { status: 503, statusText: 'Offline' });
    }
}

// Helper: network-first for pages with offline fallback
async function networkFirst(request: Request): Promise<Response> {
    const cache = await caches.open(PAGE_CACHE);
    try {
        const res = await fetch(request);
        if (res && res.ok) await cache.put(request, res.clone());
        return res;
    } catch (error) {
        console.debug('[SW] networkFirst failed:', error);
        const cached = await cache.match(request);
        if (cached) return cached;
        const offline = await caches.match(OFFLINE_URL);
        return offline || new Response('Offline', { status: 503, statusText: 'Offline' });
    }
}

sw.addEventListener('fetch', (event: FetchEvent) => {
    const req = event.request;

    // Only handle GET
    if (req.method !== 'GET') return;

    const url = new URL(req.url);

    // Same-origin only
    const sameOrigin = url.origin === self.location.origin;
    if (!sameOrigin) return;

    // Handle navigations
    if (req.mode === 'navigate') {
        event.respondWith(networkFirst(req));
        return;
    }

    // Static assets by path
    if (url.pathname.startsWith('/css/') || url.pathname.startsWith('/js/') || url.pathname.startsWith('/assets/')) {
        event.respondWith(cacheFirst(req));
    }
});

// Optional: listen for skipWaiting message for immediate activation
sw.addEventListener('message', (event: ExtendableMessageEvent) => {
    const data = event.data as { type?: string } | undefined;
    if (!data) return;
    if (data && data.type === 'SKIP_WAITING') {
        sw.skipWaiting();
    }
});
