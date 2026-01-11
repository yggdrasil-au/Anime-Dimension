// /source/ts/anime-types.ts
//
// Lightweight shared types + runtime guards for data coming from APIs.
//
// Why this exists:
// - The homepage and CSR views consume API responses that may vary slightly by source.
// - We still want TypeScript help (autocomplete + compile-time checking) without making the UI brittle.
//
// This file intentionally defines a permissive shape (lots of optional fields) and a tiny guard
// to safely convert `unknown` into a typed object at runtime.

export type Dict = Record<string, unknown>;

/**
 * A permissive "raw" anime item shape used by the UI.
 *
 * Notes:
 * - Matches the backend DTO fields where available (e.g. `title`, `slug`, `thumbnailUrl`, `tooltip`).
 * - Includes additional optional aliases used by the fallback chains in the client renderer.
 * - Do not assume any field exists at runtime; always treat properties as optional.
 */
export interface AnimeItemRaw extends Dict {
    // Common title variants
    title?: string;
    name?: string;
    english?: string;
    romaji?: string;
    native?: string;

    // Identity / routing
    slug?: string;
    url?: string;
    id?: string | number;

    // Image variants
    thumbnailUrl?: string;
    imageUrl?: string;
    image_url?: string;
    image?: string;
    poster?: string;
    posterImage?: string;
    cover?: string;
    coverImage?: string;
    thumbnail?: string;
    thumb?: string;
    img?: string;
    images?: Dict;

    // Tooltip + descriptive fields
    tooltip?: string;
    summary?: string;
    synopsis?: string;
    description?: string;

    // Metadata (used by tooltip template)
    type?: string;
    format?: string;
    year?: string;
    startYear?: string;
    aired?: string;
    airing?: string;
    studio?: string;
    studios?: unknown;
    rating?: string | number;
    score?: string | number;
    averageScore?: string | number;

    // Alt title variants
    altTitle?: string;
    alt_title?: string;
    alt?: string;
    subtitle?: string;
    titleAlt?: string;
    japanese?: string;

    // Lists
    tags?: unknown;
    genres?: unknown;
    notes?: unknown;
}

/**
 * Runtime guard for unknown values.
 */
export const isDict = (x: unknown): x is Dict => (typeof x === 'object' && x !== null);

/**
 * Convert an unknown API item into a typed object, or return null if not an object.
 */
export const asAnimeItemRaw = (x: unknown): AnimeItemRaw | null => (isDict(x) ? (x as AnimeItemRaw) : null);

/**
 * Convert an unknown array of API items into a typed list.
 * Invalid/non-object entries are dropped.
 */
export const coerceAnimeItemList = (items: unknown[]): AnimeItemRaw[] => items.map(asAnimeItemRaw).filter((x): x is AnimeItemRaw => x !== null);
