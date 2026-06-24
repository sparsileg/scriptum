/**
 * db-manager-tauri.js
 * Tauri SQLite backend — wired up in Phase 5.
 * Exposes the same interface as DBManagerWeb so all app code
 * works unchanged regardless of which backend is active.
 *
 * All methods currently throw so any accidental call in Tauri
 * mode is immediately visible rather than silently failing.
 */

const DBManagerTauri = {

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    async init() {
        // SQLite is opened in Rust at startup — nothing to do here.
        console.log('DBManagerTauri: SQLite backend ready');
        return true;
    },

    close() {
        // Connection managed by Rust — no-op.
    },

    deleteDatabase() {
        console.warn('DBManagerTauri: deleteDatabase() not supported');
    },

    // ── Generic CRUD — stubs until Phase 5 ───────────────────────────────────

    async get(storeName, key) {
        throw new Error(`DBManagerTauri.get() not yet implemented (store: ${storeName})`);
    },

    async getAll(storeName) {
        throw new Error(`DBManagerTauri.getAll() not yet implemented (store: ${storeName})`);
    },

    async put(storeName, data) {
        throw new Error(`DBManagerTauri.put() not yet implemented (store: ${storeName})`);
    },

    async delete(storeName, key) {
        throw new Error(`DBManagerTauri.delete() not yet implemented (store: ${storeName})`);
    },

    async clear(storeName) {
        throw new Error(`DBManagerTauri.clear() not yet implemented (store: ${storeName})`);
    },

    async putBulk(storeName, items) {
        throw new Error(`DBManagerTauri.putBulk() not yet implemented (store: ${storeName})`);
    },
};

// ── invoke helper — used by handlers in Phase 5 ───────────────────────────────
function invoke(command, args = {}) {
    return window.__TAURI__.core.invoke(command, args);
}
