import { apiBaseNoSlash } from '../config';
import { normalizeListResponse } from '../home';
import { renderCards } from '../ui/cards';
import { enableTooltips } from '../ui/tooltips';

// Helper: Parse common truthy strings
const boolish = (s?: string): boolean => (s ? /^(1|true|yes|on)$/i.test(s) : false);

// Helper: Shuffle array
const shuffleArray = <T>(arr: T[]): T[] => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

interface SectionDataset extends DOMStringMap {
    suggestAction?: string;
    apiBase?: string;
    totalRequested?: string;
    type?: string;
    year?: string;
    season?: string;
    showMax?: string;
    shuffle?: string;
    randomize?: string;
}

/**
 * Generic fetcher for user page sections (Suggestions, Related).
 * Handles empty states by displaying a friendly message instead of an error.
 */
const initUserSection = async (
    gridId: string,
    loadingId: string,
    errorId: string,
    emptyMessage: string,
): Promise<void> => {
    console.log(`[AD::_suggestions::initUserSection()] Initializing user section: ${gridId}`);
    const grid = document.getElementById(gridId);
    if (!grid) return;

    const loading = document.getElementById(loadingId);
    const error = document.getElementById(errorId);

    const showError = (msg: string) => {
        if (error) {
            error.textContent = msg;
            error.classList.remove('d-none');
        }
        if (grid) grid.classList.add('d-none');
    };

    const showEmpty = () => {
        if (error) {
            // We use the error container for the empty message, but style it differently if needed
            // Or just textContent.
            error.textContent = emptyMessage;
            error.classList.remove('d-none', 'alert', 'alert-danger'); // Remove danger styling if present
            error.classList.add('text-muted', 'fst-italic', 'py-3'); // Add friendly styling
        }
        if (grid) grid.classList.add('d-none');
    };

    try {
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
                throw new Error('No data source configured.');
            }
            res = await fetch(endpoint, { credentials: 'include' });
        }

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const items = normalizeListResponse(data);

        if (!Array.isArray(items) || items.length === 0) {
            showEmpty();
        } else {
            const maxToShow = Math.max(0, Number.parseInt(ds.showMax ?? '6', 10) || 6);
            const shouldShuffle = boolish(ds.shuffle) || boolish(ds.randomize);
            const pool = shouldShuffle ? shuffleArray(items as unknown[]) : (items as unknown[]);
            const toRender = pool.slice(0, maxToShow);

            if (toRender.length === 0) {
                showEmpty();
            } else {
                renderCards(grid, toRender);
                grid.classList.remove('d-none');
                enableTooltips(grid);
            }
        }
    } catch (error_) {
        console.error(`[AD::_suggestions.ts::initUserSection()] User section error (${gridId}):`, error_);
        showError('Failed to load content.');
    } finally {
        if (loading) loading.classList.add('d-none');
    }
};

export const initUserSuggestions = () =>
    initUserSection('user-suggestions-grid', 'user-suggestions-loading', 'user-suggestions-error', 'No suggestions available at the moment.');

export const initUserRelated = () =>
    initUserSection(
        'user-related-grid',
        'user-related-loading',
        'user-related-error',
        "Su...sugoi! You've already marked everything we had in mind - add more titles to your list so we can come up with some new suggestions!",
    );
