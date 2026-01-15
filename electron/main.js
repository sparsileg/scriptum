// top level function for startup of Scriptum

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const { dialog } = require('electron');
const zlib = require('zlib');
const { promisify } = require('util');
const gzip = promisify(zlib.gzip);

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 1050,
        title: 'Scriptum',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    win.loadFile('src/books.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});


// Get the database file path
function getDatabasePath() {
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'scriptum-data.json');
}

// IPC handlers for file operations
ipcMain.handle('save-database', async (event, data) => {
    try {
        const filePath = getDatabasePath();
        const dataString = JSON.stringify(data, null, 2);
        
        // Calculate hash before writing
        const originalHash = crypto.createHash('sha256').update(dataString, 'utf8').digest('hex');
        
        // Ensure directory exists
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        
        // Write to file
        await fs.writeFile(filePath, dataString, 'utf8');
        
        // Verify write
        const readData = await fs.readFile(filePath, 'utf8');
        const readHash = crypto.createHash('sha256').update(readData, 'utf8').digest('hex');
        
        if (originalHash !== readHash) {
            throw new Error('Database write verification failed - file corruption detected');
        }
        
        return { success: true, path: filePath };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('load-database', async () => {
    try {
        const filePath = getDatabasePath();
        const data = await fs.readFile(filePath, 'utf8');
        return { success: true, data: JSON.parse(data) };
    } catch (error) {
        if (error.code === 'ENOENT') {
            return { success: false, error: 'No database file found', isNewUser: true };
        }
        return { success: false, error: error.message };
    }
});

ipcMain.handle('check-database-exists', async () => {
    try {
        const filePath = getDatabasePath();
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
});

ipcMain.handle('get-database-path', async () => {
    return getDatabasePath();
});


ipcMain.handle('select-backup-folder', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        title: 'Select Backup Folder'
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
        return { success: true, path: result.filePaths[0] };
    }
    return { success: false };
});

ipcMain.handle('validate-backup-folder', async (event, folderPath) => {
    try {
        // Check if folder exists
        await fs.access(folderPath);
        
        // Test if writable by creating a temporary file
        const testFile = path.join(folderPath, '.scriptum-write-test');
        await fs.writeFile(testFile, 'test');
        await fs.unlink(testFile);
        
        return { success: true, exists: true, writable: true };
    } catch (error) {
        if (error.code === 'ENOENT') {
            // Folder doesn't exist, try to create it
            try {
                await fs.mkdir(folderPath, { recursive: true });
                return { success: true, exists: false, created: true, writable: true };
            } catch (createError) {
                return { success: false, error: `Cannot create folder: ${createError.message}` };
            }
        } else if (error.code === 'EACCES' || error.code === 'EPERM') {
            return { success: false, error: 'Folder is not writable' };
        } else {
            return { success: false, error: error.message };
        }
    }
});

ipcMain.handle('save-compressed-backup', async (event, data, folderPath) => {
    try {
        const now = new Date();
        const dateStr = now.getFullYear() +
              String(now.getMonth() + 1).padStart(2, '0') +
              String(now.getDate()).padStart(2, '0');
        
        const filename = `scriptum-backup-${dateStr}.json.gz`;
        const filePath = path.join(folderPath, filename);
        
        // Compress the data
        const dataString = JSON.stringify(data, null, 2);
        const compressed = await gzip(Buffer.from(dataString, 'utf8'));
        
        await fs.writeFile(filePath, compressed);
        
        return { success: true, path: filePath, filename };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

