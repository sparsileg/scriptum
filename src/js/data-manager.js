/**
 * data-manager.js
 * Unified data persistence layer.
 * All reads and writes go through DBManager — never directly to
 * localStorage, IndexedDB, or Tauri invoke calls.
 */

// ── Global in-memory collections ─────────────────────────────────────────────
// These mirror the active DBManager store and are kept in sync on every
// load/save. All rendering code reads from these arrays.

let books       = [];   // BooksRead
let readingList = [];   // ReadingList
let myLibrary   = [];   // MyLibrary

// ── Initialisation ────────────────────────────────────────────────────────────

/**
 * Migrate data from the old localStorage booksData blob into IndexedDB.
 * Runs once on first launch after the Phase 3 upgrade, then has nothing
 * to do on subsequent launches.
 */
async function migrateFromLocalStorage() {
    const legacy = localStorage.getItem(CONSTANTS.STORAGE_KEYS.BOOKS_DATA);
    if (!legacy) return;

    console.log('Migrating data from localStorage to IndexedDB...');
    try {
        const data = JSON.parse(legacy);

        if (data.BooksRead && data.BooksRead.length > 0) {
            // Ensure every record has an id before storing
            data.BooksRead.forEach(b => { if (!b.id) b.id = generateBookId(); });
            await DBManager.putBulk(CONSTANTS.STORES.BOOKS_READ, data.BooksRead);
        }

        if (data.ReadingList && data.ReadingList.length > 0) {
            data.ReadingList.forEach(b => { if (!b.id) b.id = generateBookId(); });
            await DBManager.putBulk(CONSTANTS.STORES.READING_LIST, data.ReadingList);
        }

        if (data.MyLibrary && data.MyLibrary.length > 0) {
            data.MyLibrary.forEach(b => { if (!b.id) b.id = generateBookId(); });
            await DBManager.putBulk(CONSTANTS.STORES.MY_LIBRARY, data.MyLibrary);
        }

        if (data.Settings) {
            // Sanitise theme path in case it's a legacy value
            if (data.Settings.displayTheme) {
                data.Settings.displayTheme = sanitiseThemePath(data.Settings.displayTheme);
            }
            await DBManager.put(CONSTANTS.STORES.SETTINGS, {
                id: 'app-settings',
                data: data.Settings
            });
        }

        // Migration complete — remove legacy blob
        localStorage.removeItem(CONSTANTS.STORAGE_KEYS.BOOKS_DATA);
        console.log('localStorage migration complete');
    } catch (e) {
        console.error('localStorage migration failed:', e);
    }
}

/**
 * Sanitise a stored theme path to the current expected format.
 * Handles legacy paths from old Electron/localStorage versions.
 */
function sanitiseThemePath(path) {
    if (!path) return CONSTANTS.THEMES.NORDIC_DARK;
    // Map any known legacy path to its current equivalent
    if (path.includes('nordic-dark'))  return CONSTANTS.THEMES.NORDIC_DARK;
    if (path.includes('nordic-light')) return CONSTANTS.THEMES.NORDIC_LIGHT;
    if (path.includes('matrix'))       return CONSTANTS.THEMES.MATRIX_CODE;
    // Unknown — fall back to default
    return CONSTANTS.THEMES.NORDIC_DARK;
}

// ── BooksRead ─────────────────────────────────────────────────────────────────

async function loadData() {
    books = await DBManager.getAll(CONSTANTS.STORES.BOOKS_READ);
}

async function saveData() {
    // saveData() is called after modifying the in-memory `books` array.
    // We bulk-replace the entire store to keep it in sync.
    await DBManager.clear(CONSTANTS.STORES.BOOKS_READ);
    if (books.length > 0) {
        await DBManager.putBulk(CONSTANTS.STORES.BOOKS_READ, books);
    }
}

async function saveBook(book) {
    await DBManager.put(CONSTANTS.STORES.BOOKS_READ, book);
}

async function deleteBook(id) {
    await DBManager.delete(CONSTANTS.STORES.BOOKS_READ, id);
}

// ── ReadingList ───────────────────────────────────────────────────────────────

async function loadReadingListData() {
    readingList = await DBManager.getAll(CONSTANTS.STORES.READING_LIST);
}

async function saveReadingListData() {
    await DBManager.clear(CONSTANTS.STORES.READING_LIST);
    if (readingList.length > 0) {
        await DBManager.putBulk(CONSTANTS.STORES.READING_LIST, readingList);
    }
}

async function saveReadingListItem(item) {
    await DBManager.put(CONSTANTS.STORES.READING_LIST, item);
}

async function deleteReadingListItem(id) {
    await DBManager.delete(CONSTANTS.STORES.READING_LIST, id);
}

// ── MyLibrary ─────────────────────────────────────────────────────────────────

async function loadMyLibraryData() {
    myLibrary = await DBManager.getAll(CONSTANTS.STORES.MY_LIBRARY);
}

async function saveMyLibraryData() {
    await DBManager.clear(CONSTANTS.STORES.MY_LIBRARY);
    if (myLibrary.length > 0) {
        await DBManager.putBulk(CONSTANTS.STORES.MY_LIBRARY, myLibrary);
    }
}

async function saveMyLibraryBook(book) {
    await DBManager.put(CONSTANTS.STORES.MY_LIBRARY, book);
}

async function deleteMyLibraryBook(id) {
    await DBManager.delete(CONSTANTS.STORES.MY_LIBRARY, id);
}

// ── Settings ──────────────────────────────────────────────────────────────────

async function loadSettingsFromDB() {
    const row = await DBManager.get(CONSTANTS.STORES.SETTINGS, 'app-settings');
    return row ? row.data : null;
}

async function saveSettingsToDB(settingsObj) {
    await DBManager.put(CONSTANTS.STORES.SETTINGS, {
        id: 'app-settings',
        data: settingsObj
    });
}

// ── Migration helpers ─────────────────────────────────────────────────────────

async function migrateExistingBooks() {
    let migrated = 0;
    books.forEach(book => {
        if (!book.id) {
            book.id = generateBookId();
            migrated++;
        }
    });
    if (migrated > 0) {
        await saveData();
        showMessage(`Migrated ${migrated} books to include unique IDs`, CONSTANTS.MESSAGE_TYPES.INFO);
    }
}

async function migrateReadingListItems() {
    let migrated = 0;
    readingList.forEach(item => {
        if (!item.id) {
            item.id = generateBookId();
            migrated++;
        }
    });
    if (migrated > 0) {
        await saveReadingListData();
    }
}

async function migrateMyLibraryItems() {
    let migrated = 0;
    myLibrary.forEach(item => {
        if (!item.id) {
            item.id = generateBookId();
            migrated++;
        }
    });
    if (migrated > 0) {
        await saveMyLibraryData();
    }
}

// ── Export / Import ───────────────────────────────────────────────────────────

/**
 * Generate the canonical unified export structure.
 * This is the format written to backup files and will be the
 * D1 sync payload in Phase 9.
 */
async function generateUnifiedDatabase() {
    const now = new Date();

    // Calculate tags metadata from myLibrary
    const tagsMetadata = {};
    myLibrary.forEach(book => {
        if (book.Tags && Array.isArray(book.Tags)) {
            book.Tags.forEach(tag => {
                tagsMetadata[tag] = (tagsMetadata[tag] || 0) + 1;
            });
        }
    });

    // Load settings
    const settings = await loadSettingsFromDB() || {};

    return {
        Header: {
            appVersion: CONSTANTS.APP_VERSION,
            timestamp:  now.toISOString()
        },
        BooksRead: books,
        BooksReadInfo: {
            totalBooks: books.length
        },
        ReadingList: readingList,
        ReadingListInfo: {
            totalBooks: readingList.length
        },
        MyLibrary: myLibrary,
        MyLibraryInfo: {
            totalBooks: myLibrary.length
        },
        TagsMetadata: tagsMetadata,
        Settings: {
            displayTheme:      localStorage.getItem(CONSTANTS.STORAGE_KEYS.SELECTED_THEME) || CONSTANTS.THEMES.NORDIC_DARK,
            dailyReadingPages: parseInt(localStorage.getItem(CONSTANTS.STORAGE_KEYS.DAILY_READING_PAGES)) || null,
            ...settings
        }
    };
}

/**
 * Import a unified database object.
 * Validates structure, applies import rules, then writes to DBManager.
 */
async function importUnifiedDatabase(data) {
    try {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid import file: not a JSON object');
        }

        if (!data.BooksRead && !data.ReadingList && !data.MyLibrary) {
            throw new Error('Invalid import file: no recognised collections found');
        }

        // BooksRead
        if (data.BooksRead && Array.isArray(data.BooksRead)) {
            const prepared = data.BooksRead.map(book => ({
                ...book,
                id: book.id || generateBookId(),
                Pages: book.Pages ? parseInt(book.Pages) || null : null,
            }));
            await DBManager.clear(CONSTANTS.STORES.BOOKS_READ);
            await DBManager.putBulk(CONSTANTS.STORES.BOOKS_READ, prepared);
            books = prepared;
        }

        // ReadingList
        if (data.ReadingList && Array.isArray(data.ReadingList)) {
            const prepared = data.ReadingList.map(item => ({
                ...item,
                id: item.id || generateBookId(),
            }));
            await DBManager.clear(CONSTANTS.STORES.READING_LIST);
            await DBManager.putBulk(CONSTANTS.STORES.READING_LIST, prepared);
            readingList = prepared;
        }

        // MyLibrary
        if (data.MyLibrary && Array.isArray(data.MyLibrary)) {
            const prepared = data.MyLibrary.map(book => ({
                ...book,
                id:    book.id || generateBookId(),
                Tags:  Array.isArray(book.Tags) ? book.Tags : [],
                Pages: book.Pages ? parseInt(book.Pages) || null : null,
            }));
            await DBManager.clear(CONSTANTS.STORES.MY_LIBRARY);
            await DBManager.putBulk(CONSTANTS.STORES.MY_LIBRARY, prepared);
            myLibrary = prepared;
        }

        // Settings
        if (data.Settings) {
            // Sanitise theme path from any legacy format
            if (data.Settings.displayTheme) {
                const sanitised = sanitiseThemePath(data.Settings.displayTheme);
                data.Settings.displayTheme = sanitised;
                localStorage.setItem(CONSTANTS.STORAGE_KEYS.SELECTED_THEME, sanitised);
                loadTheme();
            }
            await saveSettingsToDB(data.Settings);
        }

        return {
            success: true,
            counts: {
                booksRead:   books.length,
                readingList: readingList.length,
                myLibrary:   myLibrary.length
            }
        };
    } catch (e) {
        console.error('importUnifiedDatabase failed:', e);
        return { success: false, error: e.message };
    }
}

function validateBookData(booksArray) {
    return Array.isArray(booksArray) && booksArray.every(book =>
        book &&
        typeof book === 'object' &&
        book.hasOwnProperty('Title') &&
        book.hasOwnProperty('Author') &&
        typeof book.Title === 'string' &&
        typeof book.Author === 'string' &&
        book.Title.trim() !== '' &&
        book.Author.trim() !== ''
    );
}

// ── Storage info (debug) ──────────────────────────────────────────────────────

function getStorageInfo() {
    return {
        booksRead:   books.length,
        readingList: readingList.length,
        myLibrary:   myLibrary.length
    };
}
