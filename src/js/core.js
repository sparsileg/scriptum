// Global constants
// Constants for magic strings
const CONSTANTS = {
    VIEWS: {
        DASHBOARD: 'dashboard',
        ENTER_FINISHED: 'enterFinished',
        REVIEW: 'review',
        EDIT: 'edit',
        STATISTICS: 'statistics',
        SETTINGS: 'settings',
        TO_READ: 'toread',
        MY_LIBRARY: 'myLibrary'
    },
    
    STORAGE_KEYS: {
        BOOKS_DATA: 'booksData',
        SELECTED_THEME: 'selectedTheme',
        DAILY_READING_PAGES: 'dailyReadingPages'
    },
    
    THEMES: {
        NORDIC_DARK: 'css/nordic-dark.css',
        NORDIC_LIGHT: 'css/nordic-light.css',
        MATRIX_CODE: 'css/matrix-code.css'
    },
    
    MESSAGE_TYPES: {
        INFO: 'info',
        SUCCESS: 'success',
        ERROR: 'error'
    },
    
    BOOK_FIELDS: {
        FINISHED: 'Finished',
        TITLE: 'Title',
        AUTHOR: 'Author',
        PAGES: 'Pages',
        CATEGORY: 'Category',
        RECOMMEND: 'Recommend',
        ISBN: 'ISBN',
        COMMENTS: 'Comments',
        ID: 'id'
    },
    
    FILTER_OPERATORS: {
        IS_EMPTY: 'isEmpty',
        CONTAINS: 'contains',
        BETWEEN: 'between',
        LESS_THAN_EQUAL: 'lte',
        GREATER_THAN_EQUAL: 'gte',
        EQUALS: 'equals'
    },
    
    SORT_DIRECTIONS: {
        ASC: 'asc',
        DESC: 'desc'
    },

    CHART_TYPES: {
        BAR: 'bar',
        LINE: 'line'
    },
    
    DATE_FORMATS: {
        ISO: 'YYYY-MM-DD',
        STORAGE: 'DD-MMM-YYYY'
    },
    
    API_DELAYS: {
        QUICK_SEARCH: 300,
        API_RESPECT: 1000,
        DROPDOWN_CLOSE: 10,
        PAUSE_AFTER_SAVE: 3000
    },
    
    // ISBN match confidence
    CONFIDENCE_LEVELS: {
        MIN_ISBN_LOOKUP: 55,
        GOOD_MATCH: 60
    },

    // # rows in dashboard cards
    ROW_LIMITS: {
        RECENT_FINISHED: 5,
        WHATS_NEXT: 4
    },
    
    // how many books to process before outputting status message
    ISBN_MSG_INTERVAL: 10
};

const DASHBOARD_CONSTANTS = {
    STORAGE_KEY: 'dashboardCardOrder',
    DEFAULT_ORDER: [
        'quick-stats',
        'quick-actions', 
        'recent-books',
        'reading-goals',
        'whats-next',
        'library-stats'
    ],
    DRAG_CLASSES: {
        DRAGGING: 'dashboard-card-dragging',
        DRAG_OVER: 'dashboard-card-drag-over'
    }    
};


// Initialize the app
window.onload = function() {
    loadTheme();
    loadData();
    loadReadingListData();
    loadMyLibraryData();
    migrateExistingBooks();
    migrateReadingListItems();
    migrateMyLibraryItems();
    populateCategorySelects();
    renderReadBooks();
    renderDashboard();
};


function showView(viewName, buttonElement) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    // Show selected view
    document.getElementById(viewName + 'View').classList.add('active');
    if (buttonElement) {
        buttonElement.classList.add('active');
    }

    // Always populate categories when showing any view
    populateCategorySelects();

    if (viewName === CONSTANTS.VIEWS.DASHBOARD) {
        renderDashboard();
    } else if (viewName === CONSTANTS.VIEWS.REVIEW) {
        renderReadBooks();
    } else if (viewName === CONSTANTS.VIEWS.STATISTICS) {
        renderStatistics();
    } else if (viewName === CONSTANTS.VIEWS.SETTINGS) {
        loadSettings();
    } else if (viewName === CONSTANTS.VIEWS.TO_READ) {
        renderReadingList();
    } else if (viewName === CONSTANTS.VIEWS.MY_LIBRARY) {
        populateMyLibraryCategorySelects();
        populateMyLibraryBookshelfSelects();
        renderMyLibrary();
    }
}


function showMessage(text, type = CONSTANTS.MESSAGE_TYPES.INFO) {
    const messageArea = document.getElementById('messageArea');
    const timestamp = new Date().toLocaleString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    messageArea.textContent = `[${timestamp}] ${text}`;

    // Optional: different colors for different message types
    messageArea.style.borderLeftColor = type === CONSTANTS.MESSAGE_TYPES.ERROR ? '#dc3545' :
        type === CONSTANTS.MESSAGE_TYPES.SUCCESS ? '#28a745' : '#667eea';
}


function dateFromStorage(storageDate) {
    if (!storageDate) return '';
    try {
        // Handle DD-MMM-YYYY format (e.g., "15-Jan-2024")
        if (storageDate.includes('-') && storageDate.split('-')[1].length === 3) {
            const parts = storageDate.split('-');
            const day = parseInt(parts[0]);
            const monthAbbr = parts[1];
            const year = parseInt(parts[2]);
            
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthNum = months.indexOf(monthAbbr);
            
            if (monthNum !== -1) {
                // Create date in local timezone to avoid timezone shifts
                const date = new Date(year, monthNum, day);
                const localYear = date.getFullYear();
                const localMonth = String(date.getMonth() + 1).padStart(2, '0');
                const localDay = String(date.getDate()).padStart(2, '0');
                return `${localYear}-${localMonth}-${localDay}`;
            }
        }
        
        // Fallback: try parsing as-is for ISO format
        const date = new Date(storageDate);
        if (!isNaN(date.getTime())) {
            const localYear = date.getFullYear();
            const localMonth = String(date.getMonth() + 1).padStart(2, '0');
            const localDay = String(date.getDate()).padStart(2, '0');
            return `${localYear}-${localMonth}-${localDay}`;
        }
        
        return '';
    } catch (e) {
        return '';
    }
}


function generateBookId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    } else {
        // Fallback for older browsers
        return 'book_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// Date conversion functions
function dateToStorage(htmlDate) {
    if (!htmlDate) return '';
    
    // Parse the YYYY-MM-DD format directly to avoid timezone issues
    const parts = htmlDate.split('-');
    if (parts.length === 3) {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // Month is 0-indexed
        const day = parseInt(parts[2]);
        
        // Create date in local timezone
        const date = new Date(year, month, day);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        return `${date.getDate()}-${months[date.getMonth()]}-${date.getFullYear()}`;
    }
    
    return '';
}


function migrateExistingBooks() {
    let migrated = 0;
    books.forEach(book => {
        if (!book.id) {
            book.id = generateBookId();
            migrated++;
        }
    });
    
    if (migrated > 0) {
        saveData();
        showMessage(`Migrated ${migrated} books to include unique IDs`, CONSTANTS.MESSAGE_TYPES.INFO);
    }
}


function changeTheme(themePath) {
    const themeLink = document.getElementById('themeLink');
    themeLink.href = themePath;
    
    // Save preference
    localStorage.setItem(CONSTANTS.STORAGE_KEYS.SELECTED_THEME, themePath);
    
    // Refresh statistics charts if on statistics view
    if (document.getElementById('statisticsView').classList.contains('active')) {
        // Call destroyCharts from statistics.js
        if (typeof destroyCharts === 'function') {
            destroyCharts();
        }
        renderStatistics();
    }
}


function loadTheme() {
    const savedTheme = localStorage.getItem(CONSTANTS.STORAGE_KEYS.SELECTED_THEME) || CONSTANTS.THEMES.NORDIC_DARK;
    document.getElementById('themeLink').href = savedTheme;
}


function getThemeColors() {
    const themeLink = document.getElementById('themeLink');
    const currentTheme = themeLink.href;
    
    // Claude generated theme colors
    if (currentTheme.includes('nordic-dark')) {
        return { 
            primary: '#0077be',    // Blue
            secondary: '#ff6b35',  // Orange
            tertiary: '#7b68ee',   // Purple
            background: '#2e3440'
        };
    } else if (currentTheme.includes('nordic-light')) {
        return { 
            primary: '#5e81ac',    // Nordic Blue (darker for better contrast on light background)
            secondary: '#d08770',  // Nordic Orange (softer/muted orange)
            tertiary: '#b48ead',   // Nordic Purple (muted purple)
            background: '#eceff4'  // Light Nordic background
        };
    } else if (currentTheme.includes('matrix-code')) {
        return { 
            primary: '#00ff00',    // Green
            secondary: '#ffff00',  // Yellow
            tertiary: '#00ffff',   // Cyan
            background: '#000000'
        };
    } else {
        return { 
            primary: '#4a90e2',    // Blue
            secondary: '#f5a623',  // Orange
            tertiary: '#bd10e0',   // Purple
            background: '#0f0f0f'
        };
    }
}


// Load settings from localStorage
function loadSettings() {
    setTimeout(() => {
        const dailyReadingPages = localStorage.getItem('dailyReadingPages') || '';
        const pagesInput = document.getElementById('dailyReadingPages');
        
        if (pagesInput) {
            pagesInput.value = dailyReadingPages;
        }
    }, 50);
}


// Save settings to localStorage
function saveSettings(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const dailyReadingPages = formData.get('dailyReadingPages');
    
    // Theme is already saved by changeTheme() function when buttons are clicked
    
    // Save daily reading goal
    if (dailyReadingPages) {
        localStorage.setItem('dailyReadingPages', dailyReadingPages);
    } else {
        localStorage.removeItem('dailyReadingPages');
    }
    
    showMessage('Settings saved successfully', CONSTANTS.MESSAGE_TYPES.SUCCESS);
    // Navigate to dashboard
    showView('dashboard', document.querySelector('[onclick*="dashboard"]'));
}


// Reset settings to defaults
function resetSettings() {
    document.getElementById('displayTheme').value = 'css/nordic-dark.css';
    document.getElementById('dailyReadingPages').value = '';
    showMessage('Settings reset to defaults. Click Save to apply.', CONSTANTS.MESSAGE_TYPES.INFO);
}


