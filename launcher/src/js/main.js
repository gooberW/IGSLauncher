const { app, BrowserWindow, ipcMain, protocol, net, dialog } = require('electron');
const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');
const { pathToFileURL } = require('url');
const gamesFilePath = path.join(__dirname, '../data/games.json');
const dataDir = path.dirname(gamesFilePath);

// this adds support for local resources (needed for images)
protocol.registerSchemesAsPrivileged([
  { scheme: 'local-resource', privileges: { standard: true, secure: true, supportFetchAPI: true, bypassCSP: true } }
]);

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// reads the games.json file
ipcMain.handle('get-games-data', async () => {
    try {
        if (!fs.existsSync(gamesFilePath)) return { games: {} };
        const jsonData = fs.readFileSync(gamesFilePath, 'utf-8');
        return JSON.parse(jsonData);
    } catch (error) {
        console.error("[Main.js] Error loading games data:", error);
        return { games: {} };
    }
});

// removes a game from the data
ipcMain.handle('remove-game', async (event, gameName) => {
    try {
        let db = { games: {} };
        if (fs.existsSync(gamesFilePath)) {
            const fileData = fs.readFileSync(gamesFilePath, 'utf-8');
            db = JSON.parse(fileData);
        }

        delete db.games[gameName];

        fs.writeFileSync(gamesFilePath, JSON.stringify(db, null, 4));
        return { success: true };
    } catch (error) {
        console.error("[Main.js] Error removing game:", error);
        return { success: false, error: error.message };
    }
});

// saves the game data in the JSON
ipcMain.handle('save-game', async (event, gameData) => {
    try {
        let db = { games: {} };
        if (fs.existsSync(gamesFilePath)) {
            const fileData = fs.readFileSync(gamesFilePath, 'utf-8');
            db = JSON.parse(fileData);
        }

        db.games[gameData.name] = {
            path: gameData.details.path,
            coverImage: gameData.details.coverImage,
            icon: gameData.details.icon,
            tags: gameData.details.tags,
            description: gameData.details.description
        };

        fs.writeFileSync(gamesFilePath, JSON.stringify(db, null, 4));
        return { success: true };
    } catch (error) {
        console.error("[Main.js] Error saving game data:", error);
        return { success: false, error: error.message };
    }
});

// opens a file dialog to select an executable with the specified filters (exe, etc...)
ipcMain.handle('select-executable', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            { name: 'Executables', extensions: ['exe', 'bat', 'lnk', 'sh', 'app'] },
            { name: 'All file types', extensions: ['*'] }
        ]
    });
    return result.canceled ? null : result.filePaths[0];
});

// opens a file dialog to select an image
ipcMain.handle('select-image', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Imagens', extensions: ['jpg', 'png', 'jpeg', 'webp'] }
    ]
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('change-page', async (event, page) => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
        const pagePath = path.join(__dirname, '..', page);
        await win.loadFile(pagePath);
    }
});

// creates the main window
const createWindow = () => {
    const win = new BrowserWindow({
        width: 1000,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    win.loadFile(path.join(__dirname, '../settings.html'));
};

// starts the app and handles the protocol
app.whenReady().then(() => {
  protocol.handle('local-resource', async (request) => {
    try {
      const url = new URL(request.url);

      let finalPath = decodeURIComponent(url.pathname);


      if (process.platform === 'win32') {
        finalPath = finalPath.replace(/^[/\\]+([a-zA-Z]:)/, '$1');
      }

      finalPath = path.normalize(finalPath);

      console.log("Extracted path:", finalPath);

      if (!fs.existsSync(finalPath)) {
        console.error("ERROR: File not found in:", finalPath);
        return new Response('Not Found', { status: 404 });
      }

      const fileUrl = pathToFileURL(finalPath).toString();
      return await net.fetch(fileUrl);

    } catch (error) {
      console.error(error);
      return new Response('Error', { status: 500 });
    }
  });
  createWindow();

});

// launches the game
ipcMain.handle('launch-game', async (event, exePath) => {
  try {
    if (!exePath || !exePath.endsWith('.exe')) {
      throw new Error('Invalid executable');
    }

    const finalPath = path.normalize(exePath);

    spawn(finalPath, [], {
      detached: true,
      stdio: 'ignore'
    }).unref();

    return { success: true };
  } catch (err) {
    console.error('Launch error:', err);
    return { success: false, error: err.message };
  }
});

// closes the app when all windows are closed (not macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});