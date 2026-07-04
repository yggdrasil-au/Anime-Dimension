/*
|--------------------------------------------------------------------------
| CORE UI HELPERS
|--------------------------------------------------------------------------
| Basic functions for toggling UI elements.
*/

// Import toggle persistence utilities
import {
    loadPageToggles,
    saveToggleState,
    clearPageToggles,
    clearAllToggles,
} from '../utils/togglePersistence.ts';

/* :: :: Element Selectors :: START :: */

const leftAdSidebar = document.getElementById('left-ad-sidebar');
const closeLeftAdSidebarBtn = document.getElementById('close-left-ad-sidebar');
const toggleUpperHeaderBtn = document.getElementById('toggleUpperHeader');
const upperHeader = document.getElementById('upper-header');
const toggleSidebarBtn = document.getElementById('toggleSidebar');
const toggleContentTopBannerBtn = document.getElementById('toggleContentTopBanner');
const contentTopBanner = document.getElementById('content-top-banner');
const toggleInlineBannerBtn = document.getElementById('toggleInlineBanner');
const inlineBanner = document.getElementById('inline-banner');
const toggleLeftAdSidebarBtn = document.getElementById('toggleLeftAdSidebar');
const toggleRightSidebarBtn = document.getElementById('toggleRightSidebar');
const rightSidebar = document.getElementById('right-sidebar');

/* :: :: Element Selectors :: END :: */

// //

/* :: :: Functions :: START :: */

/**
 * Determines if an element is currently visible based on CSS classes and computed style.
 * Returns true if visible, false if hidden.
 */
const isElementVisible = (el: HTMLElement | null): boolean => {
    if (!el) return false;

    // If it has d-none class, it's hidden
    if (el.classList.contains('d-none')) {
        return false;
    }

    // Check computed display style
    const display = globalThis.window.getComputedStyle(el).display;
    return display !== 'none';
};

/**
 * Generic helper to toggle visibility handling SCSS defaults.
 * Toggles between 'd-none' and 'd-block' based on current computed state.
 * Optionally persists the new state to sessionStorage.
 */
const toggleElementVisibility = (el: HTMLElement | null, persistId?: string) => {
    if (!el) return;

    if (el.classList.contains('d-none')) {
        // Currently forced hidden. Unhide.
        el.classList.remove('d-none');
        // If underlying SCSS is still hidden, force show.
        if (globalThis.window.getComputedStyle(el).display === 'none') {
            el.classList.add('d-block');
        }
    } else {
        // No forced hidden class. Check actual visibility.
        if (globalThis.window.getComputedStyle(el).display === 'none') {
            // Hidden by default SCSS. Show it.
            el.classList.add('d-block');
        } else {
            // Visible. Hide it.
            el.classList.add('d-none');
            el.classList.remove('d-block');
        }
    }

    // Persist the new state if a persist ID is provided
    if (persistId) {
        const isNowVisible = isElementVisible(el);
        saveToggleState(persistId, isNowVisible);
    }
};

/**
 * Toggles the visibility of the left ad sidebar and persists state.
 */
const toggleLeftAdSidebar = () => toggleElementVisibility(leftAdSidebar, 'left-ad-sidebar');

/**
 * Hides the left ad sidebar, typically triggered by closing actions.
 * Persists state as hidden.
 */
const hideLeftAdSidebar = () => {
    // This ensures the sidebar is hidden, not toggled, which is safer for close buttons.
    leftAdSidebar?.classList.add('d-none');
    leftAdSidebar?.classList.remove('d-block');

    // Persist the hidden state
    if (leftAdSidebar) {
        saveToggleState('left-ad-sidebar', false);
    }
};

/**
 * Toggles the visibility of the upper header and persists state.
 */
const toggleUpperHeader = () => toggleElementVisibility(upperHeader, 'upper-header');

/**
 * Toggles the collapsed state of the main sidebar and persists state.
 */
const toggleSidebar = () => {
    document.body.classList.toggle('sidebar-collapsed');

    // Persist the new collapsed state
    const isNowCollapsed = document.body.classList.contains('sidebar-collapsed');
    saveToggleState('body.sidebar-collapsed', isNowCollapsed);
};

/**
 * Toggles the visibility of the content-top banner and persists state.
 */
const toggleContentTopBanner = () => toggleElementVisibility(contentTopBanner, 'content-top-banner');

/**
 * Toggles the visibility of the inline banner and persists state.
 */
const toggleInlineBanner = () => toggleElementVisibility(inlineBanner, 'inline-banner');

/**
 * Toggles the visibility of the right sidebar and persists state.
 */
const toggleRightSidebar = () => toggleElementVisibility(rightSidebar, 'right-sidebar');

/**
 * Generic utility to toggle an element's d-none class by id and persist state.
 */
const toggleVisibilityById = (id: string): void => {
    const el = document.getElementById(id);
    toggleElementVisibility(el, id);
};

/* :: :: Functions :: END :: */

// //

/* :: :: Global UI API :: START :: */

/**
 * Group all UI toggle helpers into a single global namespace.
 */
const ADUI = {
    // Toggle functions
    toggleLeftAdSidebar,
    hideLeftAdSidebar,
    toggleUpperHeader,
    toggleSidebar,
    toggleContentTopBanner,
    toggleInlineBanner,
    toggleRightSidebar,
    toggleVisibilityById,

    // Persistence functions
    clearPageToggles: (pageId?: string): void => {
        clearPageToggles(pageId);
    },
    clearAllToggles: (): void => {
        clearAllToggles();
    },

    // Theme helpers (will be populated by main.ts)
    setTheme: (_theme: any): void => {
        console.warn('[ADUI] setTheme not yet linked from main.ts');
    },
    getTheme: (): any => {
        console.warn('[ADUI] getTheme not yet linked from main.ts');
        return 'auto';
    },
    nextTheme: (): void => {
        console.warn('[ADUI] nextTheme not yet linked from main.ts');
    },
};

// Attach to globalThis (window in browsers)
(globalThis.window as any).ADUI = ADUI;
(globalThis.window as any).PHCUI = ADUI; // alias to match site initials
(globalThis.window as any).toggleVisibilityById = toggleVisibilityById;

/* :: :: Global UI API :: END :: */

// //

/* :: :: Initialization :: START :: */

/**
 * Load saved toggle states on page load to prevent FOUC.
 */
document.addEventListener('DOMContentLoaded', () => {
    console.debug('[Core] Restoring saved toggle states');
    loadPageToggles();
});

/* :: :: Initialization :: END :: */

// //

/* :: :: Event Listeners :: START :: */


// Toggle the main sidebar's collapsed state.
toggleSidebarBtn?.addEventListener('click', toggleSidebar);

// Toggle visibility of various banners and headers.
toggleUpperHeaderBtn?.addEventListener('click', toggleUpperHeader);
toggleContentTopBannerBtn?.addEventListener('click', toggleContentTopBanner);
toggleInlineBannerBtn?.addEventListener('click', toggleInlineBanner);

// Toggle visibility of the left ad sidebar.
toggleLeftAdSidebarBtn?.addEventListener('click', toggleLeftAdSidebar);

// Close the left ad sidebar with the 'X' button.
closeLeftAdSidebarBtn?.addEventListener('click', hideLeftAdSidebar);

// Close the left ad sidebar by clicking on the backdrop.
leftAdSidebar?.addEventListener('click', (event) => {
    if (event.target === leftAdSidebar) {
        hideLeftAdSidebar();
    }
});

// Toggle visibility of the right sidebar.
toggleRightSidebarBtn?.addEventListener('click', toggleRightSidebar);

/* :: :: Event Listeners :: END :: */

