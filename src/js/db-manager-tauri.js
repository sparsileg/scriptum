/**
 * db-manager-tauri.js
 * Tauri SQLite backend — wired up in Phase 5.
 * Exposes the same interface as DBManagerWeb so all app code
 * works unchanged regardless of which backend is active.
 */
const DBManagerTauri = {

    //── Lifecycle ────────────────────────────────────────────────────────────

    async init() {
        // SQLite is opened in Rust at startup — nothing to do here.
        console.log('DBManagerTauri: SQLite backend ready');
        return true;
    },

    close() {
        // Connection managed by Rust — no-op.
    },

    deleteDatabase() {
        console.warn('DBManagerTauri: deleteDatabase() not supported in Tauri mode');
    },

    //── Generic CRUD ─────────────────────────────────────────────────────────
    // Routes each storeName to the appropriate Rust command set.

    async get(storeName, key) {
        const handler = this._getHandler(storeName);
        const all = await handler.getAll();
        return all.find(item => item.id === key) || null;
    },

    async getAll(storeName) {
        return this._getHandler(storeName).getAll();
    },

    async put(storeName, data) {
        return this._getHandler(storeName).put(data);
    },

    async delete(storeName, key) {
        return this._getHandler(storeName).delete(key);
    },

    async clear(storeName) {
        return this._getHandler(storeName).clear();
    },

    async putBulk(storeName, items) {
        if (!items || items.length === 0) return;
        return this._getHandler(storeName).putBulk(items);
    },

    //── Store handlers ────────────────────────────────────────────────────────

    _getHandler(storeName) {
        switch (storeName) {
            case CONSTANTS.STORES.BOOKS_READ:   return DBManagerTauri._booksRead;
            case CONSTANTS.STORES.READING_LIST: return DBManagerTauri._readingList;
            case CONSTANTS.STORES.MY_LIBRARY:   return DBManagerTauri._myLibrary;
            case CONSTANTS.STORES.SETTINGS:     return DBManagerTauri._settings;
            default:
                throw new Error(`DBManagerTauri: unknown store "${storeName}"`);
        }
    },

    _booksRead: {
        getAll:  ()        => invoke('get_all_books_read'),
        put:     (book)    => invoke('save_book_read',       { book }),
        delete:  (id)      => invoke('delete_book_read',     { id }),
        putBulk: (books)   => invoke('save_books_read_bulk', { books }),
        clear:   ()        => invoke('clear_books_read'),
    },

    _readingList: {
        getAll:  ()        => invoke('get_all_reading_list'),
        put:     (item)    => invoke('save_reading_list_item', { item }),
        delete:  (id)      => invoke('delete_reading_list_item', { id }),
        putBulk: (items)   => invoke('save_reading_list_bulk', { items }),
        clear:   ()        => invoke('clear_reading_list'),
    },

    _myLibrary: {
        getAll:  ()        => invoke('get_all_my_library'),
        put:     (book)    => invoke('save_library_book', { book }),
        delete:  (id)      => invoke('delete_library_book', { id }),
        putBulk: (books)   => invoke('save_library_bulk', { books }),
        clear:   ()        => invoke('clear_my_library'),
    },

    _settings: {
        getAll:  async ()     => {
            const data = await invoke('get_settings');
            // Return in the same shape as IndexedDB — array with one row
            return data ? [{ id: 'app-settings', data: JSON.parse(data) }] : [];
        },
        put:     async (row)  => invoke('save_settings', {
            data: typeof row.data === 'string' ? row.data : JSON.stringify(row.data)
        }),
        delete:  (_id)        => Promise.resolve(), // settings row is never deleted
        putBulk: async (rows) => {
            for (const row of rows) {
                await DBManagerTauri._settings.put(row);
            }
        },
        clear:   ()           => Promise.resolve(), // settings row is never cleared
    },
};

//── invoke helper ─────────────────────────────────────────────────────────────

function invoke(command, args = {}) {
    return window.__TAURI__.core.invoke(command, args);
}
