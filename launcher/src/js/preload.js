const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    loadGames: () => ipcRenderer.invoke('get-games-data'),
    writeGameData: (gameData) => ipcRenderer.invoke('save-game', gameData),
    selectExecutable: () => ipcRenderer.invoke('select-executable'),
    selectImage: () => ipcRenderer.invoke('select-image'),
    launchGame: (exePath) => ipcRenderer.invoke('launch-game', exePath),
    removeGame: (gameID) => ipcRenderer.invoke('remove-game', gameID),
    changePage: (page, addToHistory) => ipcRenderer.invoke('change-page', page, addToHistory),
    getHistory: () => ipcRenderer.invoke('get-history'),
    navigateHistory: (direction) => ipcRenderer.invoke('navigate-history', direction),
    updateGame: (gameID, newData) => ipcRenderer.invoke('update-game', gameID, newData),
    getThemes: () => ipcRenderer.invoke('get-themes'),
    closeApp: () => ipcRenderer.invoke('close-window'),
    minimizeApp: () => ipcRenderer.invoke('minimize-window'),
    toggleMaximize: () => ipcRenderer.invoke("toggle-window-maximize")
});