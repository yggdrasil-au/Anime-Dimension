// filepath: source/ts/anime-shared.ts
// Shared utilities for CSR anime pages (used by anime-csr and anime-ssg-csr)
import {apiBaseNoSlash} from './config';

export type Dict = Record<string, unknown>;

export interface AnimeLike {
    title?: string;
    url?: string;
    slug?: string;
    thumbnailUrl?: string;
    image?: string;
    imageUrl?: string;
    tooltip?: string;
    summary?: string;
    year?: string;
    type?: string;
    // Added: normalized tags list when available from API
    tags?: string[];
}

export const getApiBase = (): string => apiBaseNoSlash;

export const decodeEntities = (s: string): string => {
    const ta = document.createElement('textarea');
    ta.innerHTML = s;
    return ta.value;
};

export const htmlToPlainText = (html: string, maxLen = 666): string => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const text = (tmp.textContent || '').replace(/\s+/g, ' ').trim();
    return text.length > maxLen ? `${text.slice(0, maxLen - 1)}…` : text;
};

export const pick = (o: Dict, k: string): string | undefined => (typeof o[k] === 'string' ? o[k] as string : undefined);

export const toSlug = (u?: string | null): string | undefined => {
    if (!u) return undefined;
    const m = /^\/?anime\/(.+)$/.exec(u);
    return m ? m[1] : undefined;
};

export const normalize = (raw: Dict): AnimeLike => {
    const title = pick(raw, 'title') || pick(raw, 'name') || pick(raw, 'english') || pick(raw, 'romaji') || pick(raw, 'native') || 'Untitled';
    const url = pick(raw, 'url');
    const slug = pick(raw, 'slug') || toSlug(url) || title?.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const image = pick(raw, 'thumbnailUrl') || pick(raw, 'imageUrl') || pick(raw, 'image');
    const tooltip = pick(raw, 'tooltip');
    const summary = pick(raw, 'summary') || (tooltip ? htmlToPlainText(decodeEntities(tooltip)) : undefined);
    const year = pick(raw, 'year');
    const type = pick(raw, 'type');
    // NEW: capture tags array from API if present
    let tags: string[] | undefined;
    const tagsRaw = (raw as Dict)['tags'] as unknown;
    if (Array.isArray(tagsRaw)) {
        tags = tagsRaw
            .map(v => (typeof v === 'string' ? v : String(v)))
            .map(s => s.trim())
            .filter(Boolean) as string[];
    }
    return { title, url, slug, thumbnailUrl: image, tooltip, summary, year, type, tags };
};

export const resolveSlug = (routePrefix: string): string | null => {
    const url = new URL(location.href);
    const qn = url.searchParams.get('name') || url.searchParams.get('slug');
    if (qn) return qn.trim();
    const parts = location.pathname.split('/').filter(Boolean);
    const idx = parts.indexOf(routePrefix);
    if (idx !== -1 && parts.length > idx + 1) return decodeURIComponent(parts[idx + 1]);
    return null;
};

export const fetchBySlug = async (slug: string): Promise<AnimeLike | null> => {
    // Try a direct detail endpoint first
    try {
        const res = await fetch(`${getApiBase()}/api/anime/by-slug/${encodeURIComponent(slug)}`, { credentials: 'include' });
        if (res.ok) {
            const data = (await res.json()) as Dict;
            return normalize(data);
        }
    } catch { /* ignore */ }

    // Fallback: sample list from suggestions; find matching url/slug
    try {
        const res = await fetch(`${getApiBase()}/api/suggestions/get`, { method: 'POST', credentials: 'include' });
        if (res.ok) {
            const data = await res.json() as Dict;
            const list = Array.isArray((data as Dict).list) ? (data as Dict).list as Dict[] : [];
            const found = list.find(it => toSlug(pick(it, 'url')) === slug);
            if (found) return normalize(found);
        }
    } catch { /* ignore */ }

    return null;
};

export const renderTags = (host: HTMLElement, tagsOrTooltip?: string[] | string): void => {
    host.innerHTML = '';
    // If we already have a tags array, render that directly
    if (Array.isArray(tagsOrTooltip)) {
        const tags = (tagsOrTooltip as string[]).filter(Boolean) as string[]; // removed slice limit
        for (const t of tags) {
            const span = document.createElement('span');
            span.className = 'badge text-bg-secondary';
            span.textContent = t;
            host.append(span);
        }
        return;
    }
    // Otherwise, parse from tooltip HTML if provided
    const tooltip = typeof tagsOrTooltip === 'string' ? tagsOrTooltip : undefined;
    if (!tooltip) return;
    const html = decodeEntities(tooltip);
    const div = document.createElement('div');
    div.innerHTML = html;
    const tagsUl = div.querySelector('.tags ul');
    if (!tagsUl) return;
    const tags = Array.from(tagsUl.querySelectorAll('li'))
        .map(li => li.textContent?.trim())
        .filter(Boolean) as string[]; // removed slice limit
    for (const t of tags) {
        const span = document.createElement('span');
        span.className = 'badge text-bg-secondary';
        span.textContent = t;
        host.append(span);
    }
};

export const setHeadCanonical = (routePrefix: string, slug: string, a?: AnimeLike | null): void => {
    const title = a?.title || slug;
    document.title = `${title} • Anime Dimension`;
    const desc = a?.summary || 'Anime details';
    const metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (metaDesc) metaDesc.content = desc;
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.append(link); }
    link.href = `${location.origin}/${routePrefix}/${encodeURIComponent(slug)}`;
};

export const renderRelated = async (grid: HTMLElement, routePrefix: string): Promise<void> => {
    try {
        const res = await fetch(`${getApiBase()}/api/suggestions/get`, { method: 'POST', credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json() as Dict;
        const list = Array.isArray((data as Dict).list) ? (data as Dict).list as Dict[] : [];
        const items = list.slice(0, 6).map(normalize);
        grid.innerHTML = '';
        for (const it of items) {
            const col = document.createElement('div');
            col.className = 'col';
            const card = document.createElement('div');
            card.className = 'card h-100 anim-card';
            const img = document.createElement('img');
            img.className = 'card-img-top';
            if (it.thumbnailUrl) img.src = it.thumbnailUrl;
            img.alt = it.title || '';
            const body = document.createElement('div');
            body.className = 'card-body p-2';
            const h6 = document.createElement('h6');
            h6.className = 'card-title anim-card-title mb-1';
            h6.textContent = it.title || '';
            const a = document.createElement('a');
            const slug = it.slug || toSlug(it.url || '') || '';
            a.href = slug ? `/${routePrefix}/${encodeURIComponent(slug)}` : '#';
            a.className = 'stretched-link';
            body.append(h6);
            card.append(img, body, a);
            col.append(card);
            grid.append(col);
        }
    } catch { /* ignore */ }
};
