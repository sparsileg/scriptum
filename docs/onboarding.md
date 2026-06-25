# Scriptum Development Session Onboarding

**For:** Claude (next session)
**Purpose:** Get up to speed on Stan's project and working style immediately
**Project:** Scriptum — a book tracking and library management application
**Current version:** 0.7.0

---

## Who is Stan?

Stan is the sole developer of Scriptum. He is experienced, direct, and efficient. During active development he communicates tersely:

- "proceed" = continue with next change
- "tested" / "done" / "working" = confirmed good
- Detailed only when describing problems

He does not need pleasantries, preamble, or lengthy explanations. Match his energy — be concise and direct.

---

## What is Scriptum?

Scriptum is a browser-based and Tauri desktop book tracking and personal library management tool. It allows users to:

- Track books they have read (Books Read)
- Manage a prioritised reading list (Reading List)
- Catalogue their personal book collection (My Library)
- View statistics and reading goals on a dashboard
- Export/import/backup their data

**Tech stack:** Vanilla JavaScript, CSS custom properties, IndexedDB (web) / SQLite (Tauri) — no frameworks. Source in `src/` subdirectory. Tauri v2 desktop build in `src-tauri/`.

**Dual-backend architecture:** `db-manager.js` selects the backend at runtime:
- `window.__TAURI__` present → `DBManagerTauri` → SQLite via Rust commands
- Browser → `DBManagerWeb` → IndexedDB

**Tauri desktop version:** Fully operational. SQLite migration complete through Phase 5. Dev workflow: `npx tauri dev` from project root. `withGlobalTauri: true` required in `tauri.conf.json`.

---

## Development Methodology — Read This Carefully

Stan has a well-established working methodology. Violating it causes friction.

### The Rhythm
**Plan → Discuss → Approve → One Change → Test → Confirm → Next**

### BEFORE/AFTER Blocks
All code changes are delivered as explicit BEFORE/AFTER blocks with full code — no ellipsis, no placeholders, no `// ... existing code ...`. Every block must be complete and match disk exactly. **Always include the filename** above each BEFORE/AFTER pair.

```
**filename.js**

BEFORE:
[exact existing code]

AFTER:
[complete modified code]
```

### Hard Rules
- **Always include the filename** in every BEFORE/AFTER block.
- **Discuss before coding.** Propose the approach, get explicit go-ahead.
- **Never assume file state.** Ask Stan to upload the file before making changes to a file not recently seen.
- **BEFORE blocks must match disk exactly.**
- **No ellipsis placeholders** in code blocks — ever.
- **No "repeat this for lines X and Y"** — provide full BEFORE/AFTER for each occurrence.
- **Stop `npx tauri dev` before editing files.** Hot-reload while editing can trigger partial JS execution that clears SQLite tables. This has happened multiple times.

---

## Key Architecture Details

| Concern | Pattern |
|---|---|
| All constants | `CONSTANTS` object in `config.js` |
| DB backend selector | `db-manager.js` — `DBManager` shim |
| Web persistence | `DBManagerWeb` → IndexedDB (`db-manager-web.js`) |
| Tauri persistence | `DBManagerTauri` → Rust invoke calls (`db-manager-tauri.js`) |
| Data layer | `data-manager.js` — all reads/writes go through `DBManager` |
| Themes | CSS custom properties; 3 themes: Dark (Nordic), Light (Nordic), Matrix |
| Backup | `backupDatabaseFile()` in `file.js` — gzip compressed to backup folder |
| Restore | `restore.js` — two-screen modal, accepts `.json` and `.json.gz` |
| Categories | JSON array stored in settings table; managed via `category-management.js` |
| Tags | JSON array per book record; managed via `tags.js` |
| Statistics | `statistics.js` — Chart.js charts |
| File dialogs | `tauri-plugin-dialog` via `window.__TAURI_PLUGIN_DIALOG__` |
| File writes | `tauri-plugin-fs` via `window.__TAURI_PLUGIN_FS__` |

**Naming conventions:**
- HTML IDs: camelCase (legacy) / kebab-case (new)
- CSS classes: kebab-case
- JS functions/variables: camelCase
- DB stores: camelCase (`booksRead`, `readingList`, `myLibrary`, `settings`)
- Rust commands: snake_case (`get_all_books_read`, `save_book_read`, etc.)

**JS field names vs SQL columns:**
- JS objects use PascalCase field names (`Title`, `Author`, `Finished`, `Recommend`)
- SQL columns use lowercase (`title`, `author`, `finished`, `recommend`)
- Rust structs bridge these via `#[serde(rename = "Title")]` attributes

---

## Directory Structure

```
scriptum/
├── src/
│   ├── css/
│   │   ├── base.css
│   │   └── themes/
│   │       ├── nordic-dark.css
│   │       ├── nordic-light.css
│   │       └── matrix.css
│   ├── include/
│   │   ├── chart.min.js
│   │   └── pako.min.js
│   ├── js/
│   │   ├── config.js
│   │   ├── constants.js
│   │   ├── core.js
│   │   ├── data-manager.js
│   │   ├── db-manager.js
│   │   ├── db-manager-web.js
│   │   ├── db-manager-tauri.js
│   │   ├── read-books.js
│   │   ├── reading-list.js
│   │   ├── my-library.js
│   │   ├── file.js
│   │   ├── statistics.js
│   │   ├── dashboard.js
│   │   ├── tags.js
│   │   ├── category-management.js
│   │   ├── restore.js
│   │   ├── isbn.js
│   │   └── [other app JS files]
│   └── index.html
└── src-tauri/
    ├── src/
    │   ├── main.rs
    │   ├── lib.rs
    │   ├── constants.rs
    │   ├── commands/
    │   │   ├── mod.rs
    │   │   ├── books_read.rs
    │   │   ├── reading_list.rs
    │   │   ├── my_library.rs
    │   │   └── settings.rs
    │   └── db/
    │       ├── mod.rs
    │       ├── schema.rs
    │       └── migrations.rs
    ├── capabilities/
    │   └── default.json
    ├── Cargo.toml
    └── tauri.conf.json
```

---

## SQLite Schema

**`books_read`**
`id` (TEXT PK), `title`, `author`, `author2`, `pages` (INTEGER), `category`, `recommend` (INTEGER 0/1), `isbn`, `comments`, `tags` (JSON array string), `finished` (TEXT YYYY-MM-DD), `rating` (INTEGER 1-10), `cover_url`, `date_added`, `modified`

**`reading_list`**
`id` (TEXT PK), `title`, `author`, `author2`, `pages`, `category`, `isbn`, `comments`, `tags` (JSON array string), `rank` (INTEGER nullable=Unranked), `my_library_id`, `date_added`, `modified`

**`my_library`**
`id` (TEXT PK), `title`, `author`, `author2`, `pages`, `category`, `isbn`, `comments`, `tags` (JSON array string), `location`, `patron`, `checked_out` (TEXT YYYY-MM-DD), `date_added`, `modified`

**`settings`**
`id` (TEXT PK), `data` (TEXT JSON blob) — single row keyed `'app-settings'` containing `displayTheme`, `dailyReadingPages`, `backupFolder`, `categories` (JSON array)

**Schema version:** 1 (tracked via `PRAGMA user_version`)
**SQLite location:** `~/.local/share/Scriptum/scriptum.db` (Linux)

---

## Known Issues and Gotchas

- **Hot-reload data wipe risk:** If `npx tauri dev` is running when a source file is saved mid-edit, the app hot-reloads with incomplete JS, which can trigger `clear_books_read` via `saveData()`. Always stop the dev server before editing. A 90% threshold guard in `saveData()` provides a safety net but is not foolproof.
- **Tags are JSON strings in SQLite** — must be `JSON.stringify()` before saving and `JSON.parse()` after loading. `loadMyLibraryData()` handles this on load.
- **`Recommend` field** — stored as INTEGER (0/1) in SQLite, displayed as Y/N in UI. Legacy backups use `"Y"`/`"N"` strings — `importUnifiedDatabase()` normalises these on import.
- **Date format** — stored as `YYYY-MM-DD`, displayed and entered as `MM/DD/YYYY`. `dateToStorage()` and `dateFromStorage()` in `core.js` handle conversion. Legacy backups may contain `DD-MMM-YYYY` — `dateFromStorage()` handles both.
- **`generateCategoryOptions()` is async** — all call sites must `await` it or use `.then()`.
- **`saveData()` guard** — skips write if `books.length === 0` or if in-memory count is less than 90% of SQLite count. Same guards exist for `saveReadingListData()` and `saveMyLibraryData()`.
- **Tauri file dialog** is at `window.__TAURI_PLUGIN_DIALOG__`, not `window.__TAURI__.dialog`.
- **Tauri file system** is at `window.__TAURI_PLUGIN_FS__`, not `window.__TAURI__.fs`.
- **Capabilities file** (`src-tauri/capabilities/default.json`) must explicitly grant permissions for dialog and fs operations including path scopes.

---

## Migration Plan Status

| Phase | Description | Status |
|---|---|---|
| 1 | Project restructure and library organisation | ✅ Complete |
| 2 | Backup format audit and compatibility test suite | ✅ Complete |
| 3 | Data layer replacement (localStorage → IndexedDB) | ✅ Complete |
| 4 | Tauri project scaffold | ✅ Complete |
| 5 | Rust commands and Tauri backend wiring | ✅ Complete |
| 6 | Export/import and backup (native file dialogs) | 🔄 In progress |
| 7 | Android build | ⬜ Pending |
| 8 | ISBN scanner (Android) | ⬜ Pending |
| 9 | Cloudflare D1 sync | ❌ Dropped from Scriptum scope |

---

## Open Items / What's Next

- Category Management UI — just implemented, needs testing
- UI tweaks — ongoing
- Release build (`npx tauri build`)
- Full regression test of web (IndexedDB) version
- Phase 6 — native file dialogs for export (partially done — backup folder implemented)
- Phase 7 — Android build
- Phase 8 — ISBN scanner

---

## Things Claude Got Wrong (Learn From These)

- Forgot to include filename in BEFORE/AFTER blocks — Stan had to ask repeatedly.
- Generated BEFORE blocks that didn't match disk exactly.
- Used `window.__TAURI__.dialog` instead of `window.__TAURI_PLUGIN_DIALOG__`.
- Forgot that `generateCategoryOptions()` became async — left call sites without `await`.
- Added `console.trace()` to `saveData()` without removing it — caused white page in Tauri due to unrelated stray backtick introduced during editing.
- Batched multiple file changes without explicit per-file BEFORE/AFTER — caused confusion.
- Generated `mod.rs` with trailing `nn` characters — caused Rust compile errors.

---

## Principles Stan Cares About Most

1. **Always include filename** in every BEFORE/AFTER block.
2. **Stop dev server before editing** — hot-reload has caused data loss multiple times.
3. **No stale file assumptions** — view or ask for the file before touching it.
4. **Discuss before coding** — always.
5. **Full BEFORE/AFTER blocks** — no shortcuts, no placeholders, no ellipsis.
6. **One change at a time** — always.
7. **Backward compatibility is non-negotiable** — existing backup files must always import cleanly.
8. **Never silently drop data** — unknown fields log a warning but never cause errors.
9. **Web build must always work** — after every change, the browser version is regression-tested.
10. **Clean, simple solutions** — park complexity that isn't worth it.
