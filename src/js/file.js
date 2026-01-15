// File related functions

function exportFilteredData() {
    const filteredBooks = applyCurrentFilters([...books]);
    const metadata = generateExportMetadata();
    
    const dataToExport = {
        exportInfo: metadata,
        BooksRead: filteredBooks
    };
    
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const filename = generateTimestampedFilename('books_filtered', 'json');

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showMessage(`Filtered data exported: ${filteredBooks.length} books saved to ${filename}`, CONSTANTS.MESSAGE_TYPES.SUCCESS);
}


function exportFilteredCSV() {
    const filteredBooks = applyCurrentFilters([...books]);
    const metadata = generateExportMetadata();
    const headers = [CONSTANTS.BOOK_FIELDS.FINISHED, CONSTANTS.BOOK_FIELDS.TITLE, CONSTANTS.BOOK_FIELDS.AUTHOR, 
                   CONSTANTS.BOOK_FIELDS.ISBN, CONSTANTS.BOOK_FIELDS.PAGES, CONSTANTS.BOOK_FIELDS.CATEGORY, 
                   CONSTANTS.BOOK_FIELDS.RECOMMEND, CONSTANTS.BOOK_FIELDS.COMMENTS];
    
    // Create CSV content with metadata header
    let csvContent = generateCSVTSVHeader(metadata);
    csvContent += headers.join(',') + '\n';
    
    filteredBooks.forEach(book => {
        const row = [
            escapeCSV(dateToISO(book[CONSTANTS.BOOK_FIELDS.FINISHED])),
            escapeCSV(book[CONSTANTS.BOOK_FIELDS.TITLE]),
            escapeCSV(book[CONSTANTS.BOOK_FIELDS.AUTHOR]),
            escapeCSV(book[CONSTANTS.BOOK_FIELDS.ISBN]),
            escapeCSV(book[CONSTANTS.BOOK_FIELDS.PAGES]),
            escapeCSV(book[CONSTANTS.BOOK_FIELDS.CATEGORY]),
            escapeCSV(book[CONSTANTS.BOOK_FIELDS.RECOMMEND]),
            escapeCSV(book[CONSTANTS.BOOK_FIELDS.COMMENTS])
        ];
        csvContent += row.join(',') + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = generateTimestampedFilename('books_filtered', 'csv');
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showMessage(`Filtered CSV exported: ${filteredBooks.length} books saved to ${filename}`, CONSTANTS.MESSAGE_TYPES.SUCCESS);
}


function exportFilteredTSV() {
    const filteredBooks = applyCurrentFilters([...books]);
    const metadata = generateExportMetadata();
    const headers = [CONSTANTS.BOOK_FIELDS.FINISHED, CONSTANTS.BOOK_FIELDS.TITLE, CONSTANTS.BOOK_FIELDS.AUTHOR, 
                   CONSTANTS.BOOK_FIELDS.ISBN, CONSTANTS.BOOK_FIELDS.PAGES, CONSTANTS.BOOK_FIELDS.CATEGORY, 
                   CONSTANTS.BOOK_FIELDS.RECOMMEND, CONSTANTS.BOOK_FIELDS.COMMENTS];
    
    // Create TSV content with metadata header
    let tsvContent = generateCSVTSVHeader(metadata);
    tsvContent += headers.join('\t') + '\n';
    
    filteredBooks.forEach(book => {
        const row = [
            escapeTSV(dateToISO(book[CONSTANTS.BOOK_FIELDS.FINISHED])),
            escapeTSV(book[CONSTANTS.BOOK_FIELDS.TITLE]),
            escapeTSV(book[CONSTANTS.BOOK_FIELDS.AUTHOR]),
            escapeTSV(book[CONSTANTS.BOOK_FIELDS.ISBN]),
            escapeTSV(book[CONSTANTS.BOOK_FIELDS.PAGES]),
            escapeTSV(book[CONSTANTS.BOOK_FIELDS.CATEGORY]),
            escapeTSV(book[CONSTANTS.BOOK_FIELDS.RECOMMEND]),
            escapeTSV(book[CONSTANTS.BOOK_FIELDS.COMMENTS])
        ];
        tsvContent += row.join('\t') + '\n';
    });
    
    const blob = new Blob([tsvContent], { type: 'text/plain;charset=utf-8;' });
    const filename = generateTimestampedFilename('books_filtered', 'tsv');
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showMessage(`Filtered TSV exported: ${filteredBooks.length} books saved to ${filename}`, CONSTANTS.MESSAGE_TYPES.SUCCESS);
}


// Save Database - saves as bt-data.json
function saveDatabaseFile() {
    const dataToExport = generateUnifiedDatabase();
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bt-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showMessage('Database saved as bt-data.json', CONSTANTS.MESSAGE_TYPES.SUCCESS);
}

// Backup Database - saves as bt-data-YYYYMMDD.json.gz (compressed if available)
function backupDatabaseFile() {
    const now = new Date();
    const dateStr = now.getFullYear() +
          String(now.getMonth() + 1).padStart(2, '0') +
          String(now.getDate()).padStart(2, '0');
    
    const dataToExport = generateUnifiedDatabase();
    const dataStr = JSON.stringify(dataToExport, null, 2);
    
    let blob;
    let filename = `bt-data-${dateStr}.json`;
    
    // Try to use gzip compression if pako is available
    if (typeof pako !== 'undefined') {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(dataStr);
            const compressed = pako.gzip(data);
            blob = new Blob([compressed], { type: 'application/gzip' });
            filename = `bt-data-${dateStr}.json.gz`;
        } catch (e) {
            console.warn('Compression failed, using uncompressed data:', e);
            blob = new Blob([dataStr], { type: 'application/json' });
            showMessage('Compression failed, saved uncompressed backup', CONSTANTS.MESSAGE_TYPES.INFO);
        }
    } else {
        blob = new Blob([dataStr], { type: 'application/json' });
        showMessage('Compression library not available, saved uncompressed backup', CONSTANTS.MESSAGE_TYPES.INFO);
    }
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showMessage(`Database backup saved as ${filename}`, CONSTANTS.MESSAGE_TYPES.SUCCESS);
}

function importData() {
    const file = document.getElementById('importFile').files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            let booksToValidate;

            // Handle unified format or legacy format
            if (importedData.BooksRead && Array.isArray(importedData.BooksRead)) {
                booksToValidate = importedData.BooksRead;
                
                // Load reading list if present
                if (importedData.ReadingList && Array.isArray(importedData.ReadingList)) {
                    readingList = importedData.ReadingList;
                    saveReadingListData();
                }

                // handle My Library if present
                if (importedData.MyLibrary && Array.isArray(importedData.MyLibrary)) {
                    myLibrary = importedData.MyLibrary;
                    saveMyLibraryData();
                }

                // Load settings if present
                if (importedData.Settings) {
                    if (importedData.Settings.dailyReadingPages) {
                        localStorage.setItem(CONSTANTS.STORAGE_KEYS.DAILY_READING_PAGES, 
                                           importedData.Settings.dailyReadingPages.toString());
                    }
                    // Apply the imported theme
                    if (importedData.Settings.displayTheme) {
                        changeTheme(importedData.Settings.displayTheme);
                    }
                }
                
                // Add this section after the existing Settings handling in importData function:
                if (importedData.Settings && importedData.Settings.dashboardOrder) {
                    DataManager.saveSection('DashboardOrder', importedData.Settings.dashboardOrder);
                }              

                let msg = `Database loaded successfully. ${booksToValidate.length} books read. `;
                msg += `${readingList.length} in reading list. `;
                msg += `${myLibrary.length} in library.`;
                showMessage(msg, CONSTANTS.MESSAGE_TYPES.SUCCESS);
            } else if (Array.isArray(importedData)) {
                // Legacy format - direct array
                booksToValidate = importedData;
                showMessage(`Legacy data imported successfully. ${booksToValidate.length} books loaded.`, 
                           CONSTANTS.MESSAGE_TYPES.SUCCESS);
            } else {
                showMessage('Invalid file format. Expected unified database or book array.', 
                           CONSTANTS.MESSAGE_TYPES.ERROR);
                return;
            }

            // Validate and assign
            if (!validateBookData(booksToValidate)) {
                showMessage('Invalid book data. Each book must have Title and Author fields.', 
                           CONSTANTS.MESSAGE_TYPES.ERROR);
                return;
            }

            books = booksToValidate;
            saveData();
            renderReadBooks();
            renderDashboard(); // Update dashboard with new data
            
        } catch (error) {
            showMessage('Error parsing file: ' + error.message, CONSTANTS.MESSAGE_TYPES.ERROR);
        }
        // Clear the file input so the same file can be selected again
        document.getElementById('importFile').value = '';
    };
    reader.readAsText(file);
}

