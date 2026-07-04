/*
|--------------------------------------------------------------------------
| TOGGLE PERSISTENCE SYSTEM
|--------------------------------------------------------------------------
| Manages page-scoped toggle state persistence using sessionStorage.
| Automatically captures toggle state changes and restores them on page reload.
*/

/* :: :: Constants :: START :: */

const STORAGE_PREFIX = '__ad_toggles_';

/* :: :: Constants :: END :: */

// //

/* :: :: Utilities :: START :: */

/**
 * Generates a stable page ID from the current pathname.
 * Converts "/path/to/page" → "path-to-page" or "home" for root.
 *
 * @param pathname - The current URL pathname (typically from Astro.url.pathname)
 * @returns A normalized page ID string
 */
export function generatePageId(pathname: string): string {
    const normalized = pathname
        .split('/')
        .filter((segment) => segment && segment.length > 0)
        .join('-')
        .toLowerCase();

    return normalized || 'home';
}

/**
 * Gets the storage key for a specific page's toggles.
 *
 * @param pageId - The page identifier
 * @returns The sessionStorage key
 */
function getPageStorageKey(pageId: string): string {
    return `${STORAGE_PREFIX}${pageId}`;
}

/**
 * Gets current page ID from window or generates from pathname.
 *
 * @returns The current page ID
 */
function getCurrentPageId(): string {
    return (globalThis.window as any).__adPageId || 'unknown';
}

/**
 * Retrieves all toggles for a specific page from sessionStorage.
 *
 * @param pageId - The page identifier (defaults to current page)
 * @returns Object mapping componentId → toggle state ('visible' | 'hidden')
 */
export function getPageToggles(pageId?: string): Record<string, string> {
    const id = pageId || getCurrentPageId();
    const key = getPageStorageKey(id);
    const stored = sessionStorage.getItem(key);

    return stored ? JSON.parse(stored) : {};
}

/**
 * Saves the toggle state for a component on the current page.
 * Determines visibility by checking element's computed style.
 *
 * @param componentId - The HTML element ID of the component
 * @param isVisible - Whether the component is currently visible in the DOM
 * @param pageId - Optional page ID (defaults to current page)
 */
export function saveToggleState(componentId: string, isVisible: boolean, pageId?: string): void {
    const id = pageId || getCurrentPageId();
    const key = getPageStorageKey(id);
    const toggles = getPageToggles(id);

    // Store state as 'visible' or 'hidden'
    toggles[componentId] = isVisible ? 'visible' : 'hidden';

    sessionStorage.setItem(key, JSON.stringify(toggles));
    console.debug(`[TogglePersistence] Saved ${componentId} → ${toggles[componentId]} on page ${id}`);
}

/**
 * Retrieves the saved toggle state for a specific component.
 *
 * @param componentId - The HTML element ID
 * @param pageId - Optional page ID (defaults to current page)
 * @returns 'visible' | 'hidden' | null (null if no saved state)
 */
export function getToggleState(componentId: string, pageId?: string): string | null {
    const id = pageId || getCurrentPageId();
    const toggles = getPageToggles(id);

    return toggles[componentId] || null;
}

/**
 * Determines if a component should be visible based on saved state.
 * Checks if saved state indicates visibility.
 *
 * @param componentId - The HTML element ID
 * @param pageId - Optional page ID (defaults to current page)
 * @returns true if saved state is 'visible', false otherwise
 */
export function shouldComponentBeVisible(componentId: string, pageId?: string): boolean {
    const state = getToggleState(componentId, pageId);
    return state === 'visible';
}

/* :: :: Utilities :: END :: */

// //

/* :: :: Initialization :: START :: */

/**
 * Applies saved toggle states to DOM elements on page load.
 * Restores classes ('d-none', 'd-block') and body classes.
 * Called early in Head.astro to prevent FOUC.
 *
 * @param pageId - Optional page ID (defaults to current page ID)
 */
export function loadPageToggles(pageId?: string): void {
    const id = pageId || getCurrentPageId();
    const toggles = getPageToggles(id);

    console.debug(`[TogglePersistence] Loading toggles for page ${id}:`);

    // Iterate through all saved toggles for this page
    Object.entries(toggles).forEach(([componentId, state]) => {
        // Special handling for body class toggles
        if (componentId === 'body.sidebar-collapsed') {
            if (state === 'visible') {
                document.body.classList.add('sidebar-collapsed');
            }
            return;
        }

        // Standard element visibility restoration
        const element = document.getElementById(componentId);
        if (!element) {
            console.debug(`[TogglePersistence] Element ${componentId} not found, skipping`);
            return;
        }

        if (state === 'visible') {
            // Element should be visible
            element.classList.remove('d-none');
            // Check if SCSS defaults hide it; if so, force display
            if (globalThis.window.getComputedStyle(element).display === 'none') {
                element.classList.add('d-block');
            }
        } else {
            // Element should be hidden
            element.classList.add('d-none');
            element.classList.remove('d-block');
        }
        console.debug(`[TogglePersistence] Set ${componentId} → ${state}`);
    });

    console.debug(`[TogglePersistence] Finished loading toggles for page ${id}`);
}

/* :: :: Initialization :: END :: */

// //

/* :: :: Cleanup :: START :: */

/**
 * Clears all toggle memory for a specific page.
 * If no pageId provided, clears the current page's toggles.
 *
 * @param pageId - Optional page ID to clear (defaults to current page)
 */
export function clearPageToggles(pageId?: string): void {
    const id = pageId || getCurrentPageId();
    const key = getPageStorageKey(id);

    sessionStorage.removeItem(key);
    console.debug(`[TogglePersistence] Cleared toggles for page ${id}`);
}

/**
 * Clears ALL toggle memory across all pages.
 * Use with caution.
 */
export function clearAllToggles(): void {
    const keysToRemove = [];

    // Find all toggle storage keys
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
            keysToRemove.push(key);
        }
    }

    // Remove them
    keysToRemove.forEach((key) => {
        sessionStorage.removeItem(key);
    });

    console.debug(`[TogglePersistence] Cleared all toggles (${keysToRemove.length} pages)`);
}

/* :: :: Cleanup :: END :: */
