// Data Manager - Unified data persistence layer

const DataManager = {
    // Get the current unified data structure from localStorage
    getCurrentData() {
        const stored = localStorage.getItem(CONSTANTS.STORAGE_KEYS.BOOKS_DATA);
        try {
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            console.error('Error parsing stored data:', e);
            return {};
        }
    },

    // Save a specific section while preserving others
    saveSection(sectionKey, data) {
        const currentData = this.getCurrentData();
        currentData[sectionKey] = data;
        
        try {
            localStorage.setItem(CONSTANTS.STORAGE_KEYS.BOOKS_DATA, JSON.stringify(currentData));
            return true;
        } catch (e) {
            console.error(`Error saving ${sectionKey}:`, e);
            showMessage(`Error saving ${sectionKey} data`, CONSTANTS.MESSAGE_TYPES.ERROR);
            return false;
        }
    },

    // Load a specific section with fallback default value
    loadSection(sectionKey, defaultValue = []) {
        const data = this.getCurrentData();
        return data[sectionKey] || defaultValue;
    },

    // Save the entire unified structure (used by import operations)
    saveAll(unifiedData) {
        try {
            localStorage.setItem(CONSTANTS.STORAGE_KEYS.BOOKS_DATA, JSON.stringify(unifiedData));
            return true;
        } catch (e) {
            console.error('Error saving unified data:', e);
            showMessage('Error saving complete database', CONSTANTS.MESSAGE_TYPES.ERROR);
            return false;
        }
    },

    // Clear all data (useful for testing or reset functionality)
    clearAll() {
        try {
            localStorage.removeItem(CONSTANTS.STORAGE_KEYS.BOOKS_DATA);
            return true;
        } catch (e) {
            console.error('Error clearing data:', e);
            return false;
        }
    },

    // Get storage size information (useful for debugging)
    getStorageInfo() {
        try {
            const data = localStorage.getItem(CONSTANTS.STORAGE_KEYS.BOOKS_DATA);
            return {
                exists: !!data,
                sizeBytes: data ? data.length : 0,
                sizeKB: data ? Math.round(data.length / 1024) : 0
            };
        } catch (e) {
            return { exists: false, sizeBytes: 0, sizeKB: 0 };
        }
    }
};

// Legacy function replacements - these maintain the existing API
// while using the new DataManager internally

function saveData() {
    return DataManager.saveSection('BooksRead', books);
}

function loadData() {
    books = DataManager.loadSection('BooksRead', []);
}

function saveMyLibraryData() {
    return DataManager.saveSection('MyLibrary', myLibrary);
}

function loadMyLibraryData() {
    myLibrary = DataManager.loadSection('MyLibrary', []);
}

function saveReadingListData() {
    return DataManager.saveSection('ReadingList', readingList);
}

function loadReadingListData() {
    readingList = DataManager.loadSection('ReadingList', []);
}

// Enhanced validation function
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


// Generate unified database structure
function generateUnifiedDatabase() {
    const now = new Date();
    const timestamp = now.toISOString();
    
    // Calculate tags metadata
    const tagsMetadata = {};
    myLibrary.forEach(book => {
        if (book.Tags && Array.isArray(book.Tags)) {
            book.Tags.forEach(tag => {
                tagsMetadata[tag] = (tagsMetadata[tag] || 0) + 1;
            });
        }
    });
    
    return {
        "Header": {
            "appVersion": `${appVersion}`,
            "timestamp": timestamp
        },
        "BooksRead": books,
        "BooksReadInfo": {
            "totalBooks": books.length
        },
        "ReadingList": readingList,
        "ReadingListInfo": {
            "totalBooks": readingList.length
        },
        "MyLibrary": myLibrary,
        "MyLibraryInfo": {
            "totalBooks": myLibrary.length
        },
        "TagsMetadata": tagsMetadata,
        "Settings": {
            "displayTheme": localStorage.getItem(CONSTANTS.STORAGE_KEYS.SELECTED_THEME) || CONSTANTS.THEMES.NORDIC_DARK,
            "dailyReadingPages": parseInt(localStorage.getItem(CONSTANTS.STORAGE_KEYS.DAILY_READING_PAGES)) || null,
            "dashboardOrder": DataManager.loadSection('DashboardOrder', null)
        }
    };
}


