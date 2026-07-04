/*
|--------------------------------------------------------------------------
| THEME TYPES
|--------------------------------------------------------------------------
*/

export type Theme = 'light' | 'dark' | 'night' | 'day' | 'auto';

export interface ThemeApi {
    setTheme: (theme: Theme) => void;
    getTheme: () => Theme;
    nextTheme: () => void;
}

export interface ThemeCommandTarget {
    setTheme?: (theme: Theme) => void;
    getTheme?: () => Theme;
    nextTheme?: () => void;
}

declare global {
    interface Window {
        ADUI?: ThemeCommandTarget;
        PHCUI?: ThemeCommandTarget;
        toggleVisibilityById?: (id: string) => void;
    }
}
