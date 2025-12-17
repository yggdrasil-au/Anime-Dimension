// /source/ts/anime-csr.ts

import { fetchBySlug, resolveSlug, setHeadCanonical, renderTags, renderRelated } from './anime-shared';

type Dict = Record<string, unknown>;

const select = {
    loading: () => document.getElementById('anime-loading'),
    error: () => document.getElementById('anime-error'),
    article: () => document.getElementById('anime-article'),
    title: () => document.getElementById('animeTitle'),
    meta: () => document.getElementById('animeMeta'),
    summary: () => document.getElementById('animeSummary'),
    poster: () => document.getElementById('animePoster') as HTMLImageElement | null,
    tags: () => document.getElementById('animeTags'),
    relatedSection: () => document.getElementById('related-section'),
    relatedGrid: () => document.getElementById('related-grid'),
};

const init = async (): Promise<void> => {
    const slug = resolveSlug('anime-csr');
    const loading = select.loading();
    const error = select.error();
    const article = select.article();

    if (!slug) {
        loading?.classList.add('d-none');
        if (error) { error.textContent = 'Missing anime slug (use /anime-csr/<slug> or ?name=)'; error.classList.remove('d-none'); }
        return;
    }

    try {
        const anime = await fetchBySlug(slug);
        if (!anime) throw new Error('Not found');

        setHeadCanonical('anime-csr', slug, anime);

        const titleEl = select.title();
        const metaEl = select.meta();
        const summaryEl = select.summary();
        const posterEl = select.poster();
        const tagsEl = select.tags();

        if (titleEl) titleEl.textContent = anime.title || slug;
        if (metaEl) metaEl.textContent = [anime.type, anime.year].filter(Boolean).join(' • ');
        if (summaryEl) summaryEl.textContent = anime.summary || '';
        if (posterEl && anime.thumbnailUrl) { posterEl.src = anime.thumbnailUrl; posterEl.alt = anime.title || 'Poster'; }
        // Pass tags array when available and non-empty, else fallback to tooltip HTML
        if (tagsEl) renderTags(tagsEl, (anime.tags && anime.tags.length ? anime.tags : anime.tooltip));

        article?.classList.remove('d-none');
        const relGrid = select.relatedGrid();
        const relSec = select.relatedSection();
        if (relGrid && relSec) { await renderRelated(relGrid, 'anime-csr'); relSec.classList.remove('d-none'); }
    } catch (error_) {
        if (error) { error.textContent = `Failed to load anime: ${error_ instanceof Error ? error_.message : String(error_)}`; error.classList.remove('d-none'); }
    } finally {
        loading?.classList.add('d-none');
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { void init(); });
} else {
    void init();
}

