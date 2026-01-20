const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    loadGames: () => ipcRenderer.invoke('get-games-data')
});