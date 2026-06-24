# Testing after Data Mgmt Change

Here's a comprehensive testing plan to ensure the DataManager refactoring works correctly:
## Core Data Operations
### Books Read:

**
    * Add a new book via the "Finished Book" form
    * Edit an existing book (change title, author, date, etc.)
    * Delete a book
    * Verify book count updates on dashboar_
**

### My Library:

    * Add a book to library
    * Edit library book details
    * Check out/return a book
    * Delete a library book
    * Import CSV to library

### Reading List:

**
    * Add book to reading list (with and without rank)
    * Edit reading list item
    * Delete reading list item
    * Drag and drop reordering
**

##Cross-Module Data Persistence
### Mixed operations (this is critical):

    * Add a book to Books Read, then add one to My Library - verify both are saved
    * Add to Reading List, then edit a Books Read entry - verify both persist
    * Import data, then make changes to different sections - verify all sections remain intact

## Import/Export Operations
### File operations:

    * Export Books Read as JSON/CSV/TSV
    * Export My Library data
    * Save full database (bt-data.json)
    * Import a database file with all three sections
    * Import legacy data (just books array)

## Error Handling
### Storage failures:

    * Fill up localStorage (paste large data) and try to save - verify error messages appear
    * Manually corrupt localStorage data and reload page - verify graceful fallback

## View Switching & Rendering
### Navigation:

    * Switch between all views (Dashboard, Books Read, My Library, etc.)
    * Verify data displays correctly in each view
    * Check that dashboard stats update after data changes

## Browser Storage Integrity
### Data consistency:

    * Make changes, close browser tab, reopen - verify data persists
    * Open multiple tabs, make changes in each - verify no data loss
    * Use browser dev tools to inspect localStorage structure

## Settings & Themes
### Persistence:

    * Change theme, reload page - verify theme persists
    * Set daily reading goal, reload page - verify setting persists
    * Import data with settings - verify settings are applied

## Quick Test Sequence (5 minutes)

    * Add one book to Books Read
    * Add one book to My Library
    * Add one book to Reading List
    * Switch to Dashboard - verify counts show 1/1/1
    * Export database and re-import it
    * Verify all data still shows correctly
    * Reload page and check all data persists

## Red Flags to Watch For

    * Error messages in browser console
    * Data disappearing when switching views
    * Counts on dashboard not updating
    * Export files missing data sections
    * Import operations failing silently
    * Books showing up in wrong sections

The mixed operations test is especially important since that's where the
old complex preservation logic could fail with the new unified approach.
