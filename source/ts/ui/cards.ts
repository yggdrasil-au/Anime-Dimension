// /source/ts/ui/cards.ts

import type { AnimeItemRaw, Dict } from '../anime-types';

// Small utilities for safe rendering and flexible API shapes
const getString = (o: Dict, key: string): string | undefined => (typeof o[key] === 'string' ? (o[key]) : undefined);

export const getTitle = (item: AnimeItemRaw): string => {
    return (
        getString(item, 'title') ||
        getString(item, 'name') ||
        getString(item, 'english') ||
        getString(item, 'romaji') ||
        getString(item, 'native') ||
        'Untitled'
    );
};

export const getImage = (item: AnimeItemRaw): string => {
    const images = (item.images as Dict | undefined) || undefined;
    return (
        getString(item, 'thumbnailUrl') ||
        getString(item, 'imageUrl') ||
        getString(item, 'image_url') ||
        getString(item, 'image') ||
        getString(item, 'poster') ||
        getString(item, 'posterImage') ||
        getString(item, 'cover') ||
        getString(item, 'coverImage') ||
        getString(item, 'thumbnail') ||
        getString(item, 'thumb') ||
        getString(item, 'img') ||
        (images ? getString(images, 'poster') || getString(images, 'cover') : undefined) ||
        ''
    );
};

export const getUrl = (item: AnimeItemRaw): string => {
    const url = getString(item, 'url');
    if (url) return url;
    const slug = getString(item, 'slug');
    let id: string | undefined;
    if (item.id != null) {
        id = String(item.id);
    }
    const fallback = slug || id || getTitle(item);
    return `/anime/${encodeURIComponent(fallback)}`;
};


import { buildTooltipHtml } from './tooltip-template';

/**
 * Render a list of anime items into the provided grid.
 *
 * Callers should convert API responses from `unknown` into `AnimeItemRaw[]` first
 * (see `coerceAnimeItemList()` in `/source/ts/anime-types.ts`).
 */
export const renderCards = (grid: HTMLElement, items: AnimeItemRaw[]): void => {
    grid.innerHTML = '';
    for (const it of items) {
        const col = document.createElement('div');
        col.className = 'col';

        const card = document.createElement('div');
        card.className = 'card h-100 anim-card';

        const img = document.createElement('img');
        img.className = 'card-img-top';
        const src = getImage(it);
        if (src) img.src = src;
        img.alt = getTitle(it);
        img.loading = 'lazy';
        img.decoding = 'async';

        const body = document.createElement('div');
        body.className = 'card-body p-2';

        const title = document.createElement('h6');
        title.className = 'card-title anim-card-title mb-1';
        title.textContent = getTitle(it);

        const link = document.createElement('a');
        const baseOverride = grid.getAttribute('data-url-base');
        const href = getUrl(it);
        link.href = baseOverride ? href.replace(/^\/anime\//, baseOverride) : href;
        link.className = 'stretched-link';
        link.setAttribute('aria-label', getTitle(it));

        // Tooltip setup: prefer dynamic template from available fields; fallback to server-provided HTML
        let tooltipHtml = getString(it, 'tooltip') || '';
        try {
            // If server didn't embed a tooltip blob, generate one from available fields
            if (!tooltipHtml) {
                const built = buildTooltipHtml(it);
                if (built && built.trim() !== '') tooltipHtml = built;
            }
        } catch {
            // No-op: if building fails, we just skip tooltip
        }

        if (tooltipHtml) {
            card.setAttribute('data-bs-toggle', 'tooltip');
            card.setAttribute('data-bs-placement', 'auto');
            card.setAttribute('data-bs-custom-class', 'anim-tooltip');
            // Store as data attribute; the initializer will read it and render as HTML
            card.setAttribute('data-tooltip-html', tooltipHtml);
        }

        body.append(title);
        card.append(img, body, link);
        col.append(card);
        grid.append(col);
    }
};

export default renderCards;
