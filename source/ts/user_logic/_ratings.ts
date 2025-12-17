import { byId } from './_dom';
import type { RatingsMap } from './_types';

export const renderRatingsGraph = (ratings?: RatingsMap): void => {
    const r = ratings || {};
    const order = ['5.0','4.5','4.0','3.5','3.0','2.5','2.0','1.5','1.0','0.5'];
    const values = order.map(k => Number(r[k] || 0));
    const max = Math.max(1, ...values);
    const total = values.reduce((a,b)=>a+b,0);
    const totalEl = byId('ratingsTotal');
    if (totalEl) totalEl.textContent = total.toLocaleString();
    const liNodes = document.querySelectorAll<HTMLElement>('#ratingsGraph li');
    liNodes.forEach((li, idx) => {
        const v = values[idx] ?? 0;
        const pct = Math.round((v / max) * 100);
        li.style.height = `${pct}%`;
        li.title = String(v);
    });
};

