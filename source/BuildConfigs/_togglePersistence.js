/*
|--------------------------------------------------------------------------
| TOGGLE PERSISTENCE SYSTEM (Build Config - Astro)
|--------------------------------------------------------------------------
| Provides build-time utilities for Astro components.
| For runtime toggle persistence functions, see ts/utils/_togglePersistence.ts
*/

/**
 * Generates a stable page ID from the current pathname.
 * Converts "/path/to/page" → "path-to-page" or "home" for root.
 *
 * @param {string} pathname - The current URL pathname (typically from Astro.url.pathname)
 * @returns {string} A normalized page ID string
 */
export function generatePageId(pathname) {
    const normalized = pathname
        .split('/')
        .filter((segment) => segment && segment.length > 0)
        .join('-')
        .toLowerCase();

    return normalized || 'home';
}
