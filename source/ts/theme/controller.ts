/*
|--------------------------------------------------------------------------
| THEME CONTROLLER
|--------------------------------------------------------------------------
*/

import { cleanupDayCloudLoopUpdater, renderDayClouds } from './dayClouds.ts';
import { renderNightSky } from './nightSky.ts';
import type { Theme, ThemeApi } from './types.ts';

/* :: :: Constants :: START :: */

// Keep this default aligned with the early theme preloader in source/html/components/_0-Head.astro.
const DEFAULT_THEME: Theme = 'night';

const themeIconMap: Record<Theme, string> = {
    light: 'bi-sun-fill',
    dark: 'bi-moon-fill',
    day: 'bi-brightness-high-fill',
    night: 'bi-moon-stars-fill',
    auto: 'bi-circle-half',
};

/* :: :: Constants :: END :: */

// //

/* :: :: Theme Functions :: START :: */

/**
 * Normalizes persisted theme values to known options.
 */
const isTheme = (value: string | null): value is Theme => {
    return value === 'light' || value === 'dark' || value === 'night' || value === 'day' || value === 'auto';
};

/**
 * Sets the current theme and updates persistence.
 * The corresponding pre-render theme bootstrap lives in source/html/components/_0-Head.astro.
 * @param theme - The theme mode to apply.
 */
export const setTheme = (theme: Theme): void => {
    document.documentElement.classList.remove('night-mode', 'day-mode');
    console.debug(`[AD::theme/controller.ts] Setting theme to: ${theme}`);

    switch (theme) {
        case 'night': {
            document.documentElement.setAttribute('data-bs-theme', 'dark');
            document.documentElement.classList.add('night-mode');
            console.debug('[AD::theme/controller.ts] Night mode activated.');
            break;
        }
        case 'auto': {
            const prefersDark: boolean = globalThis.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-bs-theme', prefersDark ? 'dark' : 'light');
            console.debug(`[AD::theme/controller.ts] Auto theme applied: ${prefersDark ? 'dark' : 'light'}`);
            break;
        }
        case 'day': {
            document.documentElement.setAttribute('data-bs-theme', 'light');
            document.documentElement.classList.add('day-mode');
            console.debug('[AD::theme/controller.ts] Day mode activated.');
            break;
        }
        default: {
            document.documentElement.setAttribute('data-bs-theme', theme);
            console.debug(`[AD::theme/controller.ts] Theme set to: ${theme}`);
            break;
        }
    }

    localStorage.setItem('theme', theme);

    const activeThemeIcon: HTMLElement | null = document.getElementById('theme-icon-active');
    if (activeThemeIcon) {
        activeThemeIcon.className = `bi me-2 ${themeIconMap[theme]}`;
        console.debug('[AD::theme/controller.ts] Updated active theme icon.');
    }

    const sky: HTMLElement | null = document.querySelector('.sky');
    if (sky) {
        if (theme === 'night') {
            cleanupDayCloudLoopUpdater();
            renderNightSky(sky);
        } else if (theme === 'day' || document.documentElement.classList.contains('day-mode')) {
            const prefersReducedMotion: boolean = globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches;

            if (prefersReducedMotion) {
                cleanupDayCloudLoopUpdater();
                sky.innerHTML = '';
                console.debug('[AD::theme/controller.ts] Day mode: reduced motion enabled, clouds omitted.');
            } else {
                renderDayClouds(sky);
                console.debug('[AD::theme/controller.ts] Day mode: clouds rendered.');
            }
        } else {
            cleanupDayCloudLoopUpdater();
            sky.innerHTML = '';
        }
    } else {
        cleanupDayCloudLoopUpdater();
    }
};

/**
 * Gets the current theme from localStorage.
 */
export const getTheme = (): Theme => {
    const stored: string | null = localStorage.getItem('theme');
    if (isTheme(stored)) {
        return stored;
    }

    localStorage.setItem('theme', DEFAULT_THEME);
    return DEFAULT_THEME;
};

/**
 * Cycles to the next theme in the sequence.
 */
export const nextTheme = (): void => {
    const themes: Theme[] = ['light', 'dark', 'day', 'night', 'auto'];
    const current: Theme = getTheme();
    const currentIndex: number = themes.indexOf(current);
    const normalizedCurrentIndex: number = Math.max(currentIndex, 0);
    const nextIndex: number = (normalizedCurrentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
};

/* :: :: Theme Functions :: END :: */

// //

/* :: :: Initialization :: START :: */

/**
 * Links exported theme commands into the global ADUI namespace.
 */
const linkGlobalThemeCommands = (): void => {
    const api: ThemeApi = {
        setTheme,
        getTheme,
        nextTheme,
    };

    if (globalThis.window.ADUI) {
        globalThis.window.ADUI.setTheme = api.setTheme;
        globalThis.window.ADUI.getTheme = api.getTheme;
        globalThis.window.ADUI.nextTheme = api.nextTheme;
    }

    console.debug('[AD::theme/controller.ts] Global theme commands linked to ADUI.');
};

/**
 * Initializes theme listeners and applies initial state.
 */
export const initTheme = (): void => {
    const themeSelectors: NodeListOf<HTMLElement> = document.querySelectorAll<HTMLElement>('[data-theme]');

    themeSelectors.forEach((button) => {
        button.addEventListener('click', () => {
            const themeToSet = button.getAttribute('data-theme') as Theme;
            setTheme(themeToSet);
        });
    });

    globalThis.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (localStorage.getItem('theme') === 'auto') {
            setTheme('auto');
        }
    });

    globalThis.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => {
        setTheme(getTheme());
    });

    setTheme(getTheme());
    linkGlobalThemeCommands();
};

/* :: :: Initialization :: END :: */
