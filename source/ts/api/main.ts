// /source/ts/main.ts

// import bootstrap JavaScript components to enable interactive components like dropdowns.
import '../../../node_modules/bootstrap/dist/js/bootstrap.bundle.min.js';
import { initHomeSections } from '../home';

/*
|--------------------------------------------------------------------------
| CORE UI HELPERS
|--------------------------------------------------------------------------
| Basic functions for toggling UI elements.
*/

// --- Element Selectors ---
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

// --- Functions ---

/**
 * Toggles the visibility of the left ad sidebar.
 */
const toggleLeftAdSidebar = () => {
    leftAdSidebar?.classList.toggle('d-none');
};

/**
 * Hides the left ad sidebar, typically triggered by closing actions.
 */
const hideLeftAdSidebar = () => {
    // This ensures the sidebar is hidden, not toggled, which is safer for close buttons.
    leftAdSidebar?.classList.add('d-none');
};


/**
 * Toggles the visibility of the upper header.
 */
const toggleUpperHeader = () => {
    upperHeader?.classList.toggle('d-none');
};

/**
 * Toggles the collapsed state of the main sidebar.
 */
const toggleSidebar = () => {
    document.body.classList.toggle('sidebar-collapsed');
};

/**
 * Toggles the visibility of the content-top banner.
 */
const toggleContentTopBanner = () => {
    contentTopBanner?.classList.toggle('d-none');
};

/**
 * Toggles the visibility of the inline banner.
 */
const toggleInlineBanner = () => {
    inlineBanner?.classList.toggle('d-none');
};

/**
 * Toggles the visibility of the right sidebar.
 */
const toggleRightSidebar = () => {
    rightSidebar?.classList.toggle('d-none');
};

// --- Global Exposure (NEW) ---
/**
 * Generic utility to toggle an element's d-none class by id.
 */
const toggleVisibilityById = (id: string): void => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('d-none');
};
/**
 * Group all UI toggle helpers into a single global namespace.
 */
const ADUI = {
    toggleLeftAdSidebar,
    hideLeftAdSidebar,
    toggleUpperHeader,
    toggleSidebar,
    toggleContentTopBanner,
    toggleInlineBanner,
    toggleRightSidebar,
    toggleVisibilityById,
};
// Attach to globalThis (window in browsers)
(window as Window).ADUI = ADUI;
(window as Window).toggleVisibilityById = toggleVisibilityById;
// Type augmentation for TypeScript consumers.
declare global {
    interface Window {
        ADUI: typeof ADUI;
        toggleVisibilityById: (id: string) => void;
    }
}

// --- Event Listeners ---

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

// Ensure initialization runs regardless of when the script executes
const initApp = (): void => {
    // Define a specific type for theme names for better type safety.
    type Theme = 'light' | 'dark' | 'night' | 'auto';

    /*
    |--------------------------------------------------------------------------
    | [OPTIONAL] NIGHT SKY ANIMATION MODULE
    |--------------------------------------------------------------------------
    | This function creates the animated stars for the 'Night' theme.
    */
    const toggleSkyAnimation = (): void => {
        // Type the 'sky' element as HTMLElement or null.
        const sky: HTMLElement | null = document.querySelector('.sky');
        if (!sky) {
            return;
        }

        sky.innerHTML = ''; // Clear existing stars

        if (document.documentElement.classList.contains('night-mode')) {
        // Twinkling Stars
            for (let i = 1; i <= 20; i++) {
                const star = document.createElement('div');
                star.classList.add('star');
                star.style.top = `${Math.random() * 100}%`;
                star.style.left = `${Math.random() * 100}%`;
                star.style.transform = `scale(${Math.random() * 1 + 0.5})`;
                star.style.animationDelay = `${Math.random() * 5}s`;
                star.style.animationDuration = `${Math.random() * 2 + 3}s`;
                sky.append(star);
            }

            // Shooting Stars
            const directions = ['dir--down-left', 'dir--down-right', 'dir--up-right'] as const;
            for (let i = 0; i < 7; i++) {
                const star = document.createElement('div');
                const direction = directions[Math.floor(Math.random() * directions.length)];
                star.classList.add('shooting-star', direction);

                // Explicitly type top and left as strings
                let top: string, left: string;

                if (direction === 'dir--down-left') {
                    top = `${Math.random() * 50 - 10}%`;
                    left = `${Math.random() * 50 + 60}%`;
                } else if (direction === 'dir--down-right') {
                    top = `${Math.random() * 50 - 10}%`;
                    left = `${Math.random() * 50 - 10}%`;
                } else {
                    top = `${Math.random() * 50 + 60}%`;
                    left = `${Math.random() * 50 - 10}%`;
                }

                star.style.top = top;
                star.style.left = left;
                star.style.width = `${Math.floor(Math.random() * 50 + 150)}px`;
                star.style.animationDuration = `${Math.random() * 3 + 4}s`;
                star.style.animationDelay = `${Math.random() * 10}s`;
                sky.append(star);
            }
        }
    };

    /*
    |--------------------------------------------------------------------------
    | THEME SWITCHER MODULE
    |--------------------------------------------------------------------------
    | Manages theme selection and persistence.
    */

    // Use a Record type to map Theme keys to string values (icon class names).
    const themeIconMap: Record<Theme, string> = {
        light: 'bi-sun-fill',
        dark: 'bi-moon-fill',
        night: 'bi-moon-stars-fill',
        auto: 'bi-circle-half',
    };

    const setTheme = (theme: Theme): void => {
        document.documentElement.classList.remove('night-mode');

        if (theme === 'night') {
            document.documentElement.setAttribute('data-bs-theme', 'dark');
            document.documentElement.classList.add('night-mode');
        } else if (theme === 'auto') {
            const prefersDark = globalThis.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-bs-theme', prefersDark ? 'dark' : 'light');
        } else {
            document.documentElement.setAttribute('data-bs-theme', theme);
        }

        localStorage.setItem('theme', theme);
        // Add a null check for activeThemeIcon before manipulating it.
        if (activeThemeIcon) {
            activeThemeIcon.className = `bi me-2 ${themeIconMap[theme]}`;
        }

        // Safely call the animation function
        toggleSkyAnimation();
    };

    /*
    |--------------------------------------------------------------------------
    | INITIALIZATION
    |--------------------------------------------------------------------------
    | Sets up the theme based on the user's saved preference on page load.
    */

    // Type DOM elements explicitly. getElementById can return null.
    const activeThemeIcon: HTMLElement | null = document.getElementById('theme-icon-active');
    // querySelectorAll returns a NodeListOf<Element>, which we can cast.
    const themeSelectors = document.querySelectorAll<HTMLElement>('[data-theme]');

    themeSelectors.forEach((button) => {
        button.addEventListener('click', () => {
        // Use a type assertion because we know data-theme will be a valid Theme.
            const themeToSet = button.getAttribute('data-theme') as Theme;
            setTheme(themeToSet);
        });
    });

    globalThis.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (localStorage.getItem('theme') === 'auto') {
            setTheme('auto');
        }
    });

    // Get the saved theme, defaulting to 'auto'. Use a type assertion.
    const savedTheme = (localStorage.getItem('theme') as Theme | null) || 'dark';
    setTheme(savedTheme);

    // Initialize homepage sections (popular + season) if present
    initHomeSections();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // DOM is already ready; run immediately
    initApp();
}
