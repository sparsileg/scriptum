const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    saveDatabase: (data) => ipcRenderer.invoke('save-database', data),
    loadDatabase: () => ipcRenderer.invoke('load-database'),
    checkDatabaseExists: () => ipcRenderer.invoke('check-database-exists'),
    getDatabasePath: () => ipcRenderer.invoke('get-database-path'),
    selectBackupFolder: () => ipcRenderer.invoke('select-backup-folder'),
    validateBackupFolder: (folderPath) => ipcRenderer.invoke('validate-backup-folder', folderPath),
    saveCompressedBackup: (data, folderPath) => ipcRenderer.invoke('save-compressed-backup', data, folderPath)
});

