const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    loadGames: () => ipcRenderer.invoke('get-games-data'),
    writeGameData: (gameData) => ipcRenderer.invoke('save-game', gameData),
    selectExecutable: () => ipcRenderer.invoke('select-executable'),
    selectImage: () => ipcRenderer.invoke('select-image'),
    launchGame: (exePath) => ipcRenderer.invoke('launch-game', exePath),
    removeGame: (gameName) => ipcRenderer.invoke('remove-game', gameName)
});