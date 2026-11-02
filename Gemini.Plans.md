# Feature Plan: User Anime List Data Importer (Anime-Planet Migration)

## 1. Executive Summary & Goals

### Goal
Provide users with a seamless, zero-friction path to migrate their existing anime tracking history from **Anime-Planet** into **Anime-Dimension**.

### Core Requirements
1. **Initial Provider**: **Anime-Planet** (`export-anime-{username}.json`).
2. **File Ingestion**: Intuitive drag-and-drop dropzone or file picker supporting JSON exports.
3. **Database Reconciliation**: Reconcile Anime-Planet anime titles against Anime-Dimension's `anime-dimension.sqlite3` catalog (`title`, `alt_title`, and `slug`).
4. **Interactive Review**: Show users a match preview before writing to the database (auto-matched titles vs. titles needing manual resolution or skipped).
5. **Atomic Batch Ingestion**: Batch insert/update list entries in `subModules/db/users.db` (`UserAnimeList`), followed by automatic recalculation of user watch stats and ratings distribution.
6. **Future Extensibility**: Establish a modular import architecture that can later accept MyAnimeList (`.xml`), AniList (`.json`), or Kitsu exports.

---

## 2. Investigation: Anime-Planet Export Feature Analysis

Following live browser inspection on `https://www.anime-planet.com` (authenticated as `AnimeDimension`):

### Native Export Endpoint
- **URL**: `https://www.anime-planet.com/users/export_list.php`
- **Link Location**: Prominently linked in the footer of any user anime list page (`/users/{username}/anime/*` -> *"Export your list here."*).
- **Format**: Standard **JSON** file named `export-anime-{username}.json`.
- **Generation**: Triggered by `GET https://www.anime-planet.com/api/export/anime/{session_token}`.

### JSON Schema Breakdown
```json
{
  "user": {
    "name": "AnimeDimension"
  },
  "export": {
    "type": "anime",
    "date": "2026-11-02 09:15+0000",
    "version": "0.1a"
  },
  "entries": [
    {
      "name": "Welcome to Irabu's Office",
      "status": "watched",
      "started": "2024-12-25 10:41:21+00",
      "completed": "2024-12-25 10:41:21+00",
      "rating": 0,
      "times": 1,
      "eps": 11
    },
    {
      "name": "Magical Suite Prism Nana",
      "status": "watching",
      "started": "2024-12-25 13:22:24+00",
      "completed": null,
      "rating": 0,
      "times": 1,
      "eps": 0
    },
    {
      "name": "Swallowed Star",
      "status": "watched",
      "started": "2025-12-30 20:12:28+00",
      "completed": "2025-12-30 21:10:39+00",
      "rating": 4.5,
      "times": 2,
      "eps": 26
    }
  ]
}
```

### Data Fields & Anime-Dimension Compatibility
| Anime-Planet Field | Type | Anime-Dimension Target Field | Compatibility / Mapping |
| :--- | :--- | :--- | :--- |
| `name` | string | `AnimeSlug` / `AnimeId` | Matched against `anime.title`, `anime.alt_title`, or `anime.slug`. |
| `status` | string | `Status` (int 1–6) | **1:1 Perfect Match**: <br>• `"watched"` $\rightarrow$ 1 (Watched)<br>• `"watching"` $\rightarrow$ 2 (Watching)<br>• `"dropped"` $\rightarrow$ 3 (Dropped)<br>• `"want to watch"` $\rightarrow$ 4 (WantToWatch)<br>• `"stalled"` $\rightarrow$ 5 (Stalled)<br>• `"won't watch"` $\rightarrow$ 6 (WontWatch) |
| `eps` | integer | `EpisodesWatched` | Directly mapped. |
| `rating` | number | `Rating` (double?) | **1:1 Scale Match**: Anime-Planet uses `0` (unrated) or `0.5`–`5.0`. <br>If `0` $\rightarrow$ `null`; otherwise imported as-is. |
| `times` | integer | `TimesWatched` | Directly mapped (defaults to 1). |
| `started` | string | `CreatedAt` | Parsed ISO date string for tracking history. |
| `completed` | string \| null | `UpdatedAt` | Used as completion date / update date if available. |

### Data Sufficiency Assessment
* **Verdict**: **SUFFICIENT FOR TRACKING DATA**.
* **What is present**: Full watch status, episode progress, ratings (0.5–5.0), rewatch counters, started/completed timestamps.
* **What is absent**: Anime-Planet does **NOT** export external numeric IDs (e.g. MAL ID or AniList ID) or its own internal database IDs in the JSON file—only the canonical English/Romaji title (`name`).
* **Technical Implication**: Reconciliation must rely on **robust title-based matching** against the `anime` catalog in `anime-dimension.sqlite3`.

---

## 3. Alternative & Fallback Solutions (for Unmatched Titles or Missing Files)

Because Anime-Planet exports rely on primary title strings without external IDs, title variations (e.g., punctuation differences, English vs. Romaji titles) may occasionally fail strict equality matching. The following fallback solutions will be provided:

### Solution A: Fuzzy / Multi-Pass Title Normalization Engine
1. **Pass 1 - Exact Title Match**: `LOWER(anime.title) == LOWER(name)`.
2. **Pass 2 - Exact Slug Match**: `anime.slug == slugify(name)`.
3. **Pass 3 - Alternative Title Match**: `LOWER(anime.alt_title) == LOWER(name)`.
4. **Pass 4 - Punctuation-Agnostic Match**: Stripping special characters (`:`, `-`, `'`, `!`, `?`, `,`, `.`) and matching alphanumeric tokens.
5. **Pass 5 - Substring / Prefix Match**: For long franchise titles (e.g. *Swallowed Star Season 2*).

### Solution B: Interactive Review & Manual Title Matcher (Pre-Import Step)
- Instead of blindly dropping unmatched items, the UI presents an **Import Preview Modal**:
  - **Auto-Matched** (e.g., 95%+ of items): Displayed with green badge, poster thumbnail, and matched Anime-Dimension title.
  - **Needs Review**: Unmatched items listed with an inline autocomplete search box allowing the user to select the correct anime from Anime-Dimension's catalog or click "Skip".
  - **Options**:
    - [x] *"Overwrite existing entries if already in list"* (default: off).
    - [x] *"Skip unmatched titles"*.

### Solution C: Direct Username Scraper / Public Profile Sync (No File Required)
- **Concept**: User types their Anime-Planet username (e.g., `AnimeDimension`).
- **Mechanism**: The backend requests `https://www.anime-planet.com/users/{username}/anime?mylist_view=list`.
- **Advantage**: The public HTML table includes rich metadata in tooltips:
  - Format (`TV`, `Movie`), Year, Total Episodes.
  - Studios and alternative titles.
  - Source notes (e.g. *"Source: Crunchyroll"*).
- **Use Case**: Handy if users do not want to download the JSON export file manually or if they are on mobile devices.

### Solution D: Secondary Import Format (MyAnimeList XML / AniList JSON)
- Many users keep their Anime-Planet list in sync with MyAnimeList (MAL) or AniList via migration tools.
- MAL exports standard `animelist.xml` containing `<series_animedb_id>`.
- AniList exports contain `mediaId`, which maps directly to `source_id = 1` in `external_id` inside `anime-dimension.sqlite3`.
- The import architecture will be structured to accept MAL XML and AniList JSON in addition to Anime-Planet JSON.

---

## 4. Architectural Design & Implementation Plan

### 4.1 Backend Architecture (`subModules/Anime-Dimension-api`)

#### New Endpoints (`source/api/import.cs`)
1. **`POST /api/users/me/import/preview`**:
   - **Input**: `multipart/form-data` with `.json` file, or raw JSON body `{ provider: "anime-planet", payload: { ... } }`.
   - **Processing**:
     - Validates payload structure (presence of `"entries"` array).
     - Loops through entries and executes multi-pass matching against `anime-dimension.sqlite3`.
     - Identifies already-tracked items in user's `UserAnimeList`.
   - **Output**:
     ```json
     {
       "status": "ok",
       "summary": {
         "total_entries": 150,
         "matched_count": 145,
         "unmatched_count": 5,
         "already_in_list_count": 12
       },
       "matched_entries": [
         {
           "external_name": "Welcome to Irabu's Office",
           "matched_slug": "welcome-to-irabus-office",
           "matched_title": "Welcome to Irabu's Office",
           "matched_anime_id": 4321,
           "thumbnail_url": "/data/images/...",
           "status": 1,
           "status_name": "watched",
           "episodes_watched": 11,
           "total_episodes": 11,
           "rating": null,
           "times_watched": 1
         }
       ],
       "unmatched_entries": [
         {
           "external_name": "Unknown OVA 2004",
           "status": 2,
           "episodes_watched": 1,
           "rating": 4.0
         }
       ]
     }
     ```

2. **`POST /api/users/me/import/confirm`**:
   - **Input**:
     ```json
     {
       "overwrite_existing": false,
       "entries": [
         {
           "anime_id": 4321,
           "anime_slug": "welcome-to-irabus-office",
           "status": 1,
           "episodes_watched": 11,
           "rating": null,
           "times_watched": 1
         }
       ]
     }
     ```
   - **Processing**:
     - Begins SQLite transaction on `subModules/db/users.db`.
     - Batch `UPSERT` into `UserAnimeList`:
       - If exists and `overwrite_existing = false`, skips.
       - If exists and `overwrite_existing = true`, updates status, episodes, rating.
       - If does not exist, inserts new entry with `CreatedAt` and `UpdatedAt`.
     - Calls `RecalculateUserStatsAsync(usersDb, me.UserId)` to refresh watch hours, status counters, and rating histogram.
     - Commits transaction.
   - **Output**:
     ```json
     {
       "status": "ok",
       "data": {
         "inserted_count": 133,
         "updated_count": 12,
         "skipped_count": 5
       }
     }
     ```

---

### 4.2 Frontend UI / UX Flow (`source/html/pages/users/import.astro` or Modal in `user_anime.astro`)

#### Entry Points
1. **Primary Button in Anime List Header**:
   - In `users/list/user_anime.astro`, add an **"Import List"** button (`btn btn-outline-primary btn-sm`) next to "Browse Anime".
2. **Account Settings**:
   - In `users/profile_edit_profile.astro` (or future settings page), add an **"Import & Export Data"** section.

#### Step 1: File Dropzone (Ingestion)
- Styled drag-and-drop container:
  - Cloud upload icon with text: *"Drag and drop your Anime-Planet export file here, or click to browse"*.
  - Supported format indicator: `export-anime-*.json`.
  - Helpful guide tooltip:
    > **How to get your file from Anime-Planet:**
    > 1. Visit your [Anime-Planet Export Page](https://www.anime-planet.com/users/export_list.php) (or your anime list footer).
    > 2. Click the red **"Export anime list"** button.
    > 3. Drop the downloaded `.json` file here.

#### Step 2: Instant Match Preview & Review
- Once dropped, the file is parsed and sent to `/api/users/me/import/preview`.
- Progress metrics displayed:
  - Visual circular progress meter: *"145 of 150 titles matched (97%)"*.
- Tabbed Review View:
  - **Ready to Import (145)**: Compact table with poster, title, status badge, episode count, and rating.
  - **Unmatched / Needs Review (5)**: Clear warning card allowing user to search and associate with an Anime-Dimension title or click "Skip".
  - Options checkboxes:
    - `[ ] Overwrite existing titles already on my Anime-Dimension list`
    - `[x] Skip unmatched titles`

#### Step 3: Execution & Success Feedback
- Primary action button: **"Import 145 Titles"**.
- Loading spinner with progress feedback.
- Success confirmation banner:
  - *"Successfully imported 145 anime into your collection!"*
  - Direct quick action links:
    - [View My Anime List](/users/list/user_anime.html?status=watching)
    - [View Profile & Updated Stats](/users/user.html)

---

## 5. Security & Validation Considerations

1. **File Size Limit**:
   - Cap JSON file upload to **10MB** (a large anime list of 3,000 entries is typically under 1MB).
2. **Input Sanitization**:
   - Sanitize all strings before database queries (parameterized SQLite queries via EF Core / `SqliteParameter`).
   - Validate that `status` values in JSON map strictly to permitted integers (1–6).
   - Validate that `rating` is `0` or between `0.5` and `5.0`.
   - Validate that `eps` is a non-negative integer.
3. **Session Authentication**:
   - Import endpoints strictly require active user session cookies (`me.UserId`). Guests are prompted to log in or register before importing.

---

## 6. Implementation Checklist & Phased Roadmap

### Phase 1: Backend Parsing & Matcher Engine (C#)
- [x] Create `source/api/import.cs` in `Anime-Dimension-api`.
- [x] Implement multi-pass title normalizer leveraging `ApAnMap` (27,608 title variants covering 11,251 scraped Anime-Planet entries) + fallback title/slug queries on `anime-dimension.sqlite3`.
- [x] Add `POST /api/users/me/import/preview` endpoint returning match confidence, status mapping, and identifying newer seasonal unindexed items.
- [x] Add `POST /api/users/me/import/confirm` batch transaction inserting into `UserAnimeList` and invoking `RecalculateUserStatsAsync`.
- [x] Register `app.MapImportEndpoints()` in `Program.cs`.

### Phase 2: Frontend Dropzone & Review Component (Astro/TS)
- [x] Create import modal `#importModal` inside `source/html/pages/users/list/user_anime.astro`.
- [x] Implement drag-and-drop file listener with client-side JSON parsing and validation.
- [x] Build the Match Preview Table (matched poster previews, status badges, episode counters, rating stars).
- [x] Build the Unmatched Entries Resolver with clear notice for brand new seasonal shows.
- [x] Connect the "Confirm Import" trigger to `/api/users/me/import/confirm`.

### Phase 3: UI Integration
- [x] Add "Import List" button and modal trigger on `users/list/user_anime.astro`.
- [x] Add empty state callout: In `#emptyMessage`, display *"Import from Anime-Planet"* when the user list is empty.
- [x] Inform users of offline catalog freshness for brand-new or current seasonal releases.

### Phase 4: Verification
- [x] Test with sample Anime-Planet export files (verified via Chrome DevTools subagent).
- [x] Verify automatic recalculation of watch hours and 10-tier rating histograms.
- [x] Verify handling of duplicate entries and overwrite options.

