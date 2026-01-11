import {apiBaseNoSlash} from './config';
// /source/ts/home.ts

// Small utilities for safe rendering and flexible API shapes
type Dict = Record<string, unknown>;

const safeText = (s: unknown): string => (typeof s === 'string' ? s : (s == null ? '' : String(s)));

export const normalizeListResponse = (data: unknown): unknown[] => {
    if (Array.isArray(data)) return data as unknown[];
    const obj = (typeof data === 'object' && data !== null) ? (data as Dict) : undefined;
    // Prefer explicit API shape first
    if (obj && Array.isArray(obj.list)) return obj.list as unknown[];
    const primary = obj?.items ?? obj?.results ?? obj?.data;
    if (Array.isArray(primary)) return primary as unknown[];
    if (obj) {
        for (const [, value] of Object.entries(obj)) {
            if (Array.isArray(value)) return value as unknown[];
        }
    }
    return [];
};

const getString = (o: Dict, key: string): string | undefined => (typeof o[key] === 'string' ? (o[key]) : undefined);

// Optionally convert to plaintext if needed somewhere else
const htmlToPlainText = (html: unknown, maxLen = 220): string => {
    if (typeof html !== 'string' || html.trim() === '') return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const text = (tmp.textContent || '').replace(/\s+/g, ' ').trim();
    return text.length > maxLen ? `${text.slice(0, maxLen - 1)}…` : text;
};

import { renderCards } from './ui/cards';
import { enableTooltips } from './ui/tooltips';
import { coerceAnimeItemList } from './anime-types';

// Parse common truthy strings like "true", "1", "yes", "on"
const boolish = (s?: string): boolean => (s ? /^(1|true|yes|on)$/i.test(s) : false);

const shuffleArray = <T>(arr: T[]): T[] => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

const initCardSection = async (
    gridId: string,
    loadingId: string,
    errorId: string,
): Promise<void> => {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    if (!gridId) {
        console.warn(`[AD::home.ts::initCardSection()] ${gridId}: No grid element found`);
    }
    const loading = document.getElementById(loadingId);
    const error = document.getElementById(errorId);

    const showError = (msg: unknown): void => {
        if (error) {
            error.textContent = `Failed to load: ${msg instanceof Error ? msg.message : String(msg)}`;
            error.classList.remove('d-none');
        }
    };

    try {
        interface SectionDataset extends DOMStringMap {
            suggestAction?: string;
            apiBase?: string;
            totalRequested?: string;
            type?: string;
            year?: string;
            season?: string;
            showMax?: string;
            shuffle?: string; // optional: randomize order client-side
            randomize?: string; // alias for shuffle
        }
        const ds = grid.dataset as SectionDataset;
        const suggestAction = ds.suggestAction;
        let res: Response;
        if (suggestAction) {
            const apiBase = ds.apiBase || `${apiBaseNoSlash}/api/suggestions`;
            const url = `${String(apiBase).replace(/\/$/, '')}/${suggestAction}`;
            const bodyObj: Record<string, string> = {};
            if (ds.totalRequested) bodyObj.totalRequested = String(ds.totalRequested);
            if (ds.type) bodyObj.type = String(ds.type);
            if (ds.year) bodyObj.year = String(ds.year);
            if (ds.season) bodyObj.season = String(ds.season);
            // Defaults
            bodyObj.totalRequested ??= '24';
            bodyObj.type ??= 'anime';

            const body = new URLSearchParams(bodyObj).toString();
            res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                },
                body,
                credentials: 'include',
            });
        } else {
            const endpoint = grid.getAttribute('data-endpoint');
            if (!endpoint) {
                throw new Error('No data source configured. Provide data-suggest-action or data-endpoint.');
            }
            res = await fetch(endpoint, { credentials: 'include' });
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const rawItems = normalizeListResponse(data);
        const items = coerceAnimeItemList(rawItems);
        // Debug: surface counts to help diagnose empty UI
        console.debug(`[AD::home.ts::initCardSection()] ${gridId}: fetched`, items.length, 'items');
        if (items.length === 0) {
            if (error) {
                error.textContent = 'No results found.';
                error.classList.remove('d-none');
                console.warn(`[AD::home.ts::initCardSection()] ${gridId}: No results found from API`, data);
            }
            console.warn(`[AD::home.ts::initCardSection()] ${gridId}: No results found from API`, data);
        } else {
            const maxToShow = Math.max(0, Number.parseInt(ds.showMax ?? '6', 10) || 6);
            const shouldShuffle = boolish(ds.shuffle) || boolish(ds.randomize);
            const pool = shouldShuffle ? shuffleArray(items) : items;
            const toRender = pool.slice(0, maxToShow);
            renderCards(grid, toRender);
            grid.classList.remove('d-none');
            enableTooltips(grid);
            console.debug(`[AD::home.ts::initCardSection()] ${gridId}: rendered`);
        }
    } catch (error_) {
        showError(error_);
    } finally {
        if (loading) loading.classList.add('d-none');
    }
};

export const initHomeSections = (): void => {
    // Popular this week
    void initCardSection('popular-grid', 'popular-loading', 'popular-error');
    // Current season, used in user page as well for now
    void initCardSection('season-grid', 'season-loading', 'season-error');
};

// (explicit export specifiers provided above)
