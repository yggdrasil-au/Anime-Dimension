import { byId } from './_dom';
import { formatHours } from './_utils';
import type { WatchStats } from './_types';

export const renderWatchTime = (totalMins: number): void => {
    const { text, percent } = formatHours(Math.max(0, Number(totalMins || 0)));
    const bar = byId('lifeOnAnimeBar');
    const txt = byId('lifeOnAnimeText');
    if (bar) (bar as HTMLElement).style.width = `${percent}%`;
    if (bar) bar.setAttribute('aria-valuenow', String(percent));
    if (txt) txt.textContent = text;
};

export const renderWatchStats = (stats?: WatchStats): void => {
    const statData: Record<string, number> = {
        watched: stats?.watched ?? 0,
        watching: stats?.watching ?? 0,
        want: stats?.want ?? 0,
        stalled: stats?.stalled ?? 0,
        dropped: stats?.dropped ?? 0,
        wont: stats?.wont ?? 0,
    };
    document.querySelectorAll<HTMLElement>('#watchStats .stat-num').forEach((el) => {
        const k = el.getAttribute('data-k') || '';
        if (!k) return;
        const val = statData[k] ?? 0;
        el.textContent = val.toLocaleString();
    });
};

