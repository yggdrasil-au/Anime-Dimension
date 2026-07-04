/*
|--------------------------------------------------------------------------
| NIGHT SKY RENDERING
|--------------------------------------------------------------------------
*/

/**
 * Creates the animated stars for the night theme.
 * @param sky - The .sky element to add stars to.
 */
export const renderNightSky = (sky: HTMLElement): void => {
    console.debug('[PHC::theme/nightSky.ts] renderNightSky() called.');

    sky.innerHTML = '';

    if (document.documentElement.classList.contains('night-mode')) {
        // Twinkling stars.
        for (let i = 1; i <= 20; i++) {
            const star: HTMLDivElement = document.createElement('div');
            star.classList.add('star');
            star.style.top = `${Math.random() * 100}%`;
            star.style.left = `${Math.random() * 100}%`;
            star.style.transform = `scale(${Math.random() * 1 + 0.5})`;
            star.style.animationDelay = `${Math.random() * 5}s`;
            star.style.animationDuration = `${Math.random() * 2 + 3}s`;
            sky.append(star);
        }

        // Shooting stars.
        const directions = ['dir--down-left', 'dir--down-right', 'dir--up-right'] as const;
        for (let i = 0; i < 7; i++) {
            const star: HTMLDivElement = document.createElement('div');
            const direction = directions[Math.floor(Math.random() * directions.length)];
            star.classList.add('shooting-star', direction);

            let top: string;
            let left: string;

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

    console.debug('[PHC::theme/nightSky.ts] Night sky render completed.');
};
