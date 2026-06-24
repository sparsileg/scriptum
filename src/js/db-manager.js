/**
 * db-manager.js
 * Selects the appropriate database backend at runtime.
 *
 * DBManagerTauri — Tauri desktop/mobile builds (SQLite via Rust commands)
 * DBManagerWeb   — Browser builds (IndexedDB)
 *
 * All code above this file uses DBManager exclusively and never
 * references either backend directly.
 */

const DBManager = typeof window.__TAURI__ !== 'undefined'
    ? DBManagerTauri
    : DBManagerWeb;
