// Sites\Anime-Dimension\main\source\ts\main.ts

// Import bootstrap JavaScript components to enable interactive components like dropdowns.
import * as bootstrap from 'npm:bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js';

import './main/_core.ts';

import { initHomeSections } from './home.ts';
import { initTheme } from './theme/index.ts';

// Attach to global window object so tooltips.ts and inline scripts can access it.
(globalThis.window as any).bootstrap = bootstrap;

// --- Initialization ---

// Ensure initialization runs regardless of when the script executes.
const initApp = (): void => {
    initTheme();
    initHomeSections();
};

if (document.readyState === 'loading') {
    console.debug('[AD::main.ts] Document still loading, waiting for DOMContentLoaded to initialize.');
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    console.debug('[AD::main.ts] Document loaded, initializing app.');
    initApp();
}
