/*
|--------------------------------------------------------------------------
| DAY CLOUD RENDERING
|--------------------------------------------------------------------------
*/

const cloudPathSelector: string = '.cloud-shape-1, .cloud-shape-2, .cloud-shape-3, .cloud-shape-4';

const cloudPathData: string = 'M 427.59 130.74 h -58 c -3.41 0 -6.19 -2.27 -6.19 -5 s 2.78 -5 6.19 -5 h 21.94 c 3.4 0 6.19 -2.27 6.19 -5 s -2.79 -5 -6.19 -5 h -58 c -3.41 0 -6.2 -2.26 -6.2 -5 s 2.79 -5 6.2 -5 H 353 c 3.41 0 6.2 -2.27 6.2 -5 s -2.79 -5 -6.2 -5 h -75.68 c -3.4 0 -6.19 2.27 -6.19 5 s 2.79 5 6.19 5 h 4 c 3.38 -0.04 6.2 2.26 6.2 5 s -2.82 4.96 -6.2 5 h -31.86 c -3.41 0 -6.19 2.27 -6.19 5 s 2.78 5 6.19 5 h 67.93 c 3.41 0 6.2 2.26 6.2 5 s -2.79 4.96 -6.2 5 h -31.83 c -3.41 0 -6.19 2.27 -6.19 5 s 2.78 5 6.19 5 h 142 c 3.4 0 6.19 -2.27 6.19 -5 s -2.75 -5 -6.16 -5';

let disposeCloudLoopUpdater: (() => void) | null = null;

/**
 * Removes viewport listeners tied to day cloud loop updates.
 */
export const cleanupDayCloudLoopUpdater = (): void => {
    if (disposeCloudLoopUpdater) {
        disposeCloudLoopUpdater();
        disposeCloudLoopUpdater = null;
        console.debug('[PHC::theme/dayClouds.ts] Day cloud loop listeners cleaned up.');
    }
};

/**
 * Measures cloud path bounds and writes viewport-aware loop distances.
 * @param sky - The .sky element hosting cloud SVG markup.
 */
const updateCloudLoopBounds = (sky: HTMLElement): void => {
    const cloudPaths: NodeListOf<SVGPathElement> = sky.querySelectorAll<SVGPathElement>(cloudPathSelector);
    if (cloudPaths.length === 0) {
        return;
    }

    const viewportWidth: number = globalThis.innerWidth;
    sky.classList.add('is-measuring');

    cloudPaths.forEach((path) => {
        const pathBounds: DOMRect = path.getBoundingClientRect();
        const startX: number = viewportWidth - pathBounds.left;
        const endX: number = 0 - pathBounds.right;

        path.style.setProperty('--cloud-start-x', `${startX}px`);
        path.style.setProperty('--cloud-end-x', `${endX}px`);
    });

    sky.classList.remove('is-measuring');
    console.debug('[PHC::theme/dayClouds.ts] Day cloud loop bounds updated for current viewport.');
};

/**
 * Initializes viewport listeners that keep day cloud loops aligned to visible bounds.
 * @param sky - The .sky element hosting cloud SVG markup.
 */
const initCloudLoopUpdater = (sky: HTMLElement): void => {
    cleanupDayCloudLoopUpdater();

    let debounceTimer: ReturnType<typeof globalThis.setTimeout> | null = null;

    const scheduleUpdate = (): void => {
        if (debounceTimer !== null) {
            globalThis.clearTimeout(debounceTimer);
        }

        debounceTimer = globalThis.setTimeout(() => {
            updateCloudLoopBounds(sky);
            debounceTimer = null;
        }, 120);
    };

    updateCloudLoopBounds(sky);
    globalThis.addEventListener('resize', scheduleUpdate);
    globalThis.addEventListener('orientationchange', scheduleUpdate);

    disposeCloudLoopUpdater = (): void => {
        if (debounceTimer !== null) {
            globalThis.clearTimeout(debounceTimer);
            debounceTimer = null;
        }

        globalThis.removeEventListener('resize', scheduleUpdate);
        globalThis.removeEventListener('orientationchange', scheduleUpdate);
    };

    console.debug('[PHC::theme/dayClouds.ts] Day cloud loop updater initialized.');
};

/**
 * Injects day clouds and starts viewport-aware loop updates.
 * @param sky - The .sky element hosting cloud SVG markup.
 */
export const renderDayClouds = (sky: HTMLElement): void => {
    sky.innerHTML = `
        <div class="clouds-container" aria-hidden="true">
            <svg class="cloud-svg cloud--1" viewBox="0 0 1200 158" xmlns="http://www.w3.org/2000/svg" focusable="false"><path class="cloud-shape-1" d="${cloudPathData}" /></svg>
            <svg class="cloud-svg cloud--2" viewBox="0 0 1200 158" xmlns="http://www.w3.org/2000/svg" focusable="false"><path class="cloud-shape-2" d="${cloudPathData}" /></svg>
            <svg class="cloud-svg cloud--3" viewBox="0 0 1200 158" xmlns="http://www.w3.org/2000/svg" focusable="false"><path class="cloud-shape-3" d="${cloudPathData}" /></svg>
            <svg class="cloud-svg cloud--4" viewBox="0 0 1200 158" xmlns="http://www.w3.org/2000/svg" focusable="false"><path class="cloud-shape-4" d="${cloudPathData}" /></svg>
        </div>
    `;

    initCloudLoopUpdater(sky);
    console.debug('[PHC::theme/dayClouds.ts] Day clouds rendered.');
};
