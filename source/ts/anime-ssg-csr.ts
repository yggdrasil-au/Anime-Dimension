// /source/ts/anime-ssg.ts
// Very similar to anime-csr, but reads slug from data attribute or path /anime-ssg/<slug>

import { fetchBySlug, renderTags, renderRelated, setHeadCanonical, resolveSlug } from './anime-shared';

const init = async (): Promise<void> => {
    const root = document.getElementById('anime-ssg');
    const slug = root?.getAttribute('data-slug') || resolveSlug('anime-ssg') || '';

    const loading = document.getElementById('anime-loading');
    const error = document.getElementById('anime-error');
    const article = document.getElementById('anime-article');

    if (!slug) {
        loading?.classList.add('d-none');
        if (error) { error.textContent = 'Missing anime slug'; error.classList.remove('d-none'); }
        return;
    }

    try {
        const anime = await fetchBySlug(slug);
        if (!anime) throw new Error('Not found');

        setHeadCanonical('anime-ssg', slug, anime);

        const titleEl = document.getElementById('animeTitle');
        const metaEl = document.getElementById('animeMeta');
        const summaryEl = document.getElementById('animeSummary');
        const posterEl = document.getElementById('animePoster') as HTMLImageElement | null;
        const tagsEl = document.getElementById('animeTags');

        if (titleEl) titleEl.textContent = anime.title || slug;
        if (metaEl) metaEl.textContent = [anime.type, anime.year].filter(Boolean).join(' • ');
        if (summaryEl) summaryEl.textContent = anime.summary || '';
        if (posterEl && anime.thumbnailUrl) { posterEl.src = anime.thumbnailUrl; posterEl.alt = anime.title || 'Poster'; }
        // Use tags array when available, fallback to tooltip HTML
        if (tagsEl) {
            renderTags(tagsEl, anime.tags || anime.tooltip);
        }

        article?.classList.remove('d-none');

        const relSec = document.getElementById('related-section');
        const relGrid = document.getElementById('related-grid');
        if (relSec && relGrid) { await renderRelated(relGrid, 'anime-ssg'); relSec.classList.remove('d-none'); }
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

