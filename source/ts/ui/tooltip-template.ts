// /source/ts/ui/tooltip-template.ts

// Build tooltip HTML on the client from whatever fields are available.
// Mirrors the structure in `source/html/components/tooltip.astro` but runs at runtime.

type Dict = Record<string, unknown>;

const asString = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);
const asNumber = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);

const str = (o: Dict, ...keys: string[]): string | undefined => {
    for (const k of keys) {
        const v = o[k];
        if (typeof v === 'string' && v.trim() !== '') return v;
    }
    return undefined;
};

const num = (o: Dict, ...keys: string[]): number | undefined => {
    for (const k of keys) {
        const v = o[k];
        if (typeof v === 'number' && Number.isFinite(v)) return v;
        if (typeof v === 'string' && v.trim() !== '') {
            const n = Number(v);
            if (Number.isFinite(n)) return n;
        }
    }
    return undefined;
};

const list = (o: Dict, ...keys: string[]): string[] | undefined => {
    for (const k of keys) {
        const v = o[k];
        if (Array.isArray(v)) {
            const arr = (v as unknown[])
                .map(x => (typeof x === 'string' ? x : String(x)))
                .map(s => s.trim())
                .filter(Boolean);
            if (arr.length) return arr as string[];
        }
        if (typeof v === 'string' && v.trim() !== '') {
            // Support comma or pipe separated tags
            const arr = v.split(/[|,]/).map(s => s.trim()).filter(Boolean);
            if (arr.length) return arr;
        }
    }
    return undefined;
};

const getTitle = (it: Dict): string => (
    str(it, 'title', 'name', 'english', 'romaji', 'native') || 'Untitled'
);

export interface TooltipDataLike {
    title?: string;
    altTitle?: string;
    type?: string;
    studio?: string;
    year?: string;
    rating?: string | number;
    description?: string;
    notes?: string[];
    tags?: string[];
}

const normalize = (it: Dict): TooltipDataLike => {
    const title = getTitle(it);
    const altTitleRaw = str(it, 'altTitle', 'alt_title', 'alt', 'subtitle', 'titleAlt', 'japanese', 'native', 'romaji', 'english');
    const altTitle = altTitleRaw && altTitleRaw !== title ? altTitleRaw : undefined;
    const type = str(it, 'type', 'format');
    // studio/studios: prefer a single string
    const studio = str(it, 'studio') || (list(it, 'studios')?.[0]);
    const year = str(it, 'year', 'startYear', 'aired', 'airing')?.replace(/\s+/g, ' ').trim();
    const ratingNum = num(it, 'rating', 'score', 'averageScore');
    const ratingStr = str(it, 'rating', 'score');
    const rating = ratingNum == null ? (ratingStr ?? undefined) : String(Math.round(ratingNum * 10) / 10);
    const description = str(it, 'description', 'summary', 'synopsis');
    const notes = list(it, 'notes');
    const tags = list(it, 'tags', 'genres');
    return { title, altTitle, type, studio, year, rating, description, notes, tags };
};

// Safely create text nodes (avoid inline HTML injection)
const appendTextEl = (p: ParentNode & Element, tag: string, text: string, className?: string): HTMLElement => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    el.textContent = text;
    p.appendChild(el);
    return el;
};

export const buildTooltipHtml = (raw: Dict): string => {
    const data = normalize(raw);
    const root = document.createElement('div');

    // Title
    appendTextEl(root, 'h5', data.title ?? 'Untitled', 'theme-font');

    // Alt title
    if (data.altTitle) {
        const h6 = appendTextEl(root, 'h6', `Alt title: ${data.altTitle}`, 'theme-font tooltip-alt');
        h6.setAttribute('role', 'heading');
        h6.setAttribute('aria-level', '6');
    }

    // Entry bar (type / studio / year / rating)
    const showEntry = Boolean(data.type || data.studio || data.year || data.rating);
    if (showEntry) {
        const ul = document.createElement('ul');
        ul.className = 'entryBar';
        if (data.type) {
            appendTextEl(ul, 'li', data.type, 'type');
        }
        if (data.studio) {
            appendTextEl(ul, 'li', data.studio);
        }
        if (data.year) {
            appendTextEl(ul, 'li', data.year, 'iconYear');
        }
        if (data.rating) {
            const li = document.createElement('li');
            const div = document.createElement('div');
            div.className = 'ttRating';
            div.textContent = String(data.rating);
            li.appendChild(div);
            ul.appendChild(li);
        }
        root.appendChild(ul);
    }

    // Description
    if (data.description) {
        appendTextEl(root, 'p', data.description);
    }

    // Notes
    if (data.notes && data.notes.length) {
        const notesDiv = document.createElement('div');
        notesDiv.className = 'tooltip notes';
        for (const n of data.notes) {
            if (!n) continue;
            appendTextEl(notesDiv, 'p', n);
        }
        root.appendChild(notesDiv);
    }

    // Tags
    if (data.tags && data.tags.length) {
        const tagsDiv = document.createElement('div');
        tagsDiv.className = 'tags';
        appendTextEl(tagsDiv, 'h4', 'Tags');
        const ul = document.createElement('ul');
        for (const t of data.tags) {
            if (!t) continue;
            appendTextEl(ul, 'li', t);
        }
        tagsDiv.appendChild(ul);
        root.appendChild(tagsDiv);
    }

    return root.innerHTML;
};

export default buildTooltipHtml;

