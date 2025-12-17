
export default class Main {
    constructor() {
        if (!('serviceWorker' in navigator)) return
        // In dev we serve from /public via Astro; in prod from site root
        const swUrl = '/service-worker.js'
        navigator.serviceWorker.register(swUrl, { scope: '/' })
            .then((reg) => {
                console.log('[AD::register-service-worker.ts::constructor()] Registered:', reg.scope)
            })
            .catch((error) => {
                console.warn('[AD::register-service-worker.ts::constructor()] Registration failed:', error)
            })
    }
}

new Main();