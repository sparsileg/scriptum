// ── App initialisation ────────────────────────────────────────────────────────

window.onload = async function () {
    loadTheme();

    // Initialise the database backend (IndexedDB in browser, no-op in Tauri)
    await DBManager.init();

    // One-time migration from old localStorage blob if present
    await migrateFromLocalStorage();

    // Load all collections into memory
    await loadData();
    await loadReadingListData();
    await loadMyLibraryData();

    // Assign IDs to any records that predate the id field
    await migrateExistingBooks();
    await migrateReadingListItems();
    await migrateMyLibraryItems();

    populateCategorySelects();
    renderReadBooks();
    renderDashboard();
};

// ── View routing ──────────────────────────────────────────────────────────────

function showView(viewName, buttonElement) {
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    document.getElementById(viewName + 'View').classList.add('active');
    if (buttonElement) {
        buttonElement.classList.add('active');
    }

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

// ── Message area ──────────────────────────────────────────────────────────────

function showMessage(text, type = CONSTANTS.MESSAGE_TYPES.INFO) {
    const messageArea = document.getElementById('messageArea');
    const timestamp = new Date().toLocaleString('en-US', {
        hour12: false,
        hour:   '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    messageArea.textContent = `[${timestamp}] ${text}`;

    messageArea.style.borderLeftColor =
        type === CONSTANTS.MESSAGE_TYPES.ERROR   ? '#dc3545' :
        type === CONSTANTS.MESSAGE_TYPES.SUCCESS  ? '#28a745' : '#667eea';
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function dateFromStorage(storageDate) {
    if (!storageDate) return '';
    try {
        // Handle DD-MMM-YYYY format (e.g., "15-Jan-2024")
        if (storageDate.includes('-') && storageDate.split('-')[1].length === 3) {
            const parts    = storageDate.split('-');
            const day      = parseInt(parts[0]);
            const monthAbbr = parts[1];
            const year     = parseInt(parts[2]);
            const months   = ['Jan','Feb','Mar','Apr','May','Jun',
                               'Jul','Aug','Sep','Oct','Nov','Dec'];
            const monthNum = months.indexOf(monthAbbr);
            if (monthNum !== -1) {
                const date = new Date(year, monthNum, day);
                return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
            }
        }
        // Fallback: ISO or other parseable format
        const date = new Date(storageDate);
        if (!isNaN(date.getTime())) {
            return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
        }
        return '';
    } catch (e) {
        return '';
    }
}

function dateToStorage(htmlDate) {
    if (!htmlDate) return '';
    const parts = htmlDate.split('-');
    if (parts.length === 3) {
        const months = ['Jan','Feb','Mar','Apr','May','Jun',
                        'Jul','Aug','Sep','Oct','Nov','Dec'];
        const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return `${date.getDate()}-${months[date.getMonth()]}-${date.getFullYear()}`;
    }
    return '';
}

// ── ID generation ─────────────────────────────────────────────────────────────

function generateBookId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'book_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ── Theme ─────────────────────────────────────────────────────────────────────

function changeTheme(themePath) {
    const themeLink = document.getElementById('themeLink');
    themeLink.href = themePath;
    localStorage.setItem(CONSTANTS.STORAGE_KEYS.SELECTED_THEME, themePath);

    if (document.getElementById('statisticsView').classList.contains('active')) {
        if (typeof destroyCharts === 'function') destroyCharts();
        renderStatistics();
    }
}

function loadTheme() {
    const saved = localStorage.getItem(CONSTANTS.STORAGE_KEYS.SELECTED_THEME);
    // Sanitise in case a legacy path is stored
    const theme = saved ? sanitiseThemePath(saved) : CONSTANTS.THEMES.NORDIC_DARK;
    document.getElementById('themeLink').href = theme;
    if (saved !== theme) {
        // Update stored value if it was a legacy path
        localStorage.setItem(CONSTANTS.STORAGE_KEYS.SELECTED_THEME, theme);
    }
}

function getThemeColors() {
    const themeLink = document.getElementById('themeLink');
    const current   = themeLink.href;

    if (current.includes('nordic-dark')) {
        return { primary: '#0077be', secondary: '#ff6b35', tertiary: '#7b68ee', background: '#2e3440' };
    } else if (current.includes('nordic-light')) {
        return { primary: '#5e81ac', secondary: '#d08770', tertiary: '#b48ead', background: '#eceff4' };
    } else if (current.includes('matrix')) {
        return { primary: '#00ff00', secondary: '#ffff00', tertiary: '#00ffff', background: '#000000' };
    }
    return { primary: '#4a90e2', secondary: '#f5a623', tertiary: '#bd10e0', background: '#0f0f0f' };
}

// ── Settings ──────────────────────────────────────────────────────────────────

function loadSettings() {
    setTimeout(() => {
        const pagesInput = document.getElementById('dailyReadingPages');
        if (pagesInput) {
            pagesInput.value = localStorage.getItem(CONSTANTS.STORAGE_KEYS.DAILY_READING_PAGES) || '';
        }
    }, 50);
}

async function saveSettings(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const dailyReadingPages = formData.get('dailyReadingPages');

    if (dailyReadingPages) {
        localStorage.setItem(CONSTANTS.STORAGE_KEYS.DAILY_READING_PAGES, dailyReadingPages);
    } else {
        localStorage.removeItem(CONSTANTS.STORAGE_KEYS.DAILY_READING_PAGES);
    }

    showMessage('Settings saved successfully', CONSTANTS.MESSAGE_TYPES.SUCCESS);
    showView('dashboard', document.querySelector('[onclick*="dashboard"]'));
}

function resetSettings() {
    document.getElementById('dailyReadingPages').value = '';
    showMessage('Settings reset to defaults. Click Save to apply.', CONSTANTS.MESSAGE_TYPES.INFO);
}
