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


// Save Database - saves as <APP_NAME>-data.json
async function saveDatabaseFile() {
    const dataToExport = await generateUnifiedDatabase();
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${CONSTANTS.APP_NAME}-data.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showMessage(`Data downloaded as ${CONSTANTS.APP_NAME}-data.json`, CONSTANTS.MESSAGE_TYPES.SUCCESS);
}

// Backup Database - saves as scriptum-YYYYMMDD.json.gz (compressed if available)
async function backupDatabaseFile() {
    const now = new Date();
    const dateStr = now.getFullYear() +
          String(now.getMonth() + 1).padStart(2, '0') +
          String(now.getDate()).padStart(2, '0');
    const dataToExport = await generateUnifiedDatabase();
    const dataStr = JSON.stringify(dataToExport, null, 2);
    let filename = `${CONSTANTS.APP_NAME}-${dateStr}.json`;

    // If running in Tauri and a backup folder is set, write directly to disk
    if (typeof window.__TAURI__ !== 'undefined') {
        const settings = await loadSettingsFromDB() || {};
        if (settings.backupFolder) {
            try {
                if (typeof pako !== 'undefined') {
                    // Write compressed binary file
                    const encoder = new TextEncoder();
                    const data = encoder.encode(dataStr);
                    const compressed = pako.gzip(data);
                    const compressedFilename = `${CONSTANTS.APP_NAME}-${dateStr}.json.gz`;
                    const filePath = `${settings.backupFolder}/${compressedFilename}`;
                    console.log('Writing compressed backup to:', filePath);
                    await window.__TAURI_PLUGIN_FS__.writeFile(filePath, compressed);
                    showMessage(`Database backup saved to ${filePath}`, CONSTANTS.MESSAGE_TYPES.SUCCESS);
                } else {
                    // Write uncompressed text file
                    const filePath = `${settings.backupFolder}/${filename}`;
                    console.log('Writing uncompressed backup to:', filePath);
                    await window.__TAURI_PLUGIN_FS__.writeTextFile(filePath, dataStr);
                    showMessage(`Database backup saved to ${filePath}`, CONSTANTS.MESSAGE_TYPES.SUCCESS);
                }
                return;
            } catch (e) {
                console.error('Backup to folder failed:', e);
                showMessage('Could not write to backup folder: ' + (e.message || JSON.stringify(e)), CONSTANTS.MESSAGE_TYPES.ERROR);
                return;
            }
        }
    }

    // Fallback: browser download (web build or no backup folder set)
    let blob;
    if (typeof pako !== 'undefined') {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(dataStr);
            const compressed = pako.gzip(data);
            blob = new Blob([compressed], { type: 'application/gzip' });
            filename = `scriptum-${dateStr}.json.gz`;
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

async function importData() {
    const file = document.getElementById('importFile').files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            const result = await importUnifiedDatabase(importedData);
            if (result.success) {
                showMessage(
                    `Database loaded successfully. ${result.counts.booksRead} books read, ` +
                    `${result.counts.readingList} in reading list, ` +
                    `${result.counts.myLibrary} in library.`,
                    CONSTANTS.MESSAGE_TYPES.SUCCESS
                );
                renderReadBooks();
                renderDashboard();
            } else {
                showMessage('Import failed: ' + result.error, CONSTANTS.MESSAGE_TYPES.ERROR);
            }
        } catch (error) {
            showMessage('Error parsing file: ' + error.message, CONSTANTS.MESSAGE_TYPES.ERROR);
        }
        document.getElementById('importFile').value = '';
    };
    reader.readAsText(file);
}
