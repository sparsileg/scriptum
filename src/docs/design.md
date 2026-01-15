# Design document

For a book tracker expanding into multiple capabilities, I'd recommend a
dashboard-centered approach rather than cramming everything into the
existing navbar. Here's my reasoning.

## Current Design

Primary database location:

Use Electron's userData directory: ~\AppData\Roaming\Scriptum\
Main database file: scriptum-data.json
Auto-save on every data change

File operations:

Load on startup: Check for existing database file, load if present
Auto-save: Replace current saveData(), saveMyLibraryData(), saveReadingListData() calls with file writes
Backup: Keep current download behavior for now
Save Database: Keep current download behavior as fallback/export option

New:

    * CONSTANT for database filename.
    * Uses hash function to verify database write.
    * Three 'save' functions collapsed into one write function.
    * Setting for backup folder.

Implementation phases:

Phase 0: Add
Phase 1: Add file system functions to main.js and expose via IPC
Phase 2: Create new data persistence functions that write to files
Phase 3: Replace existing save calls with file-based saves
Phase 4: Add auto-load on app startup
Phase 5: Later remove download-based saves once stable

Error handling:

Fallback to localStorage if file operations fail
User notification if file system access issues occur
Automatic backup before major operations

File structure:
~\AppData\Roaming\Scriptum\
├── scriptum-data.json (main database)
└── backups\ (future automatic backups)



## Mobile Considerations

    * Ensure the interface works well on mobile devices for on-the-go data entry


