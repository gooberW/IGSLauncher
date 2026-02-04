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

const themesFilePath = path.join(__dirname, '../data/themes.json');

ipcMain.handle('get-themes', async () => {
    try {
        if (!fs.existsSync(themesFilePath)) return { themes: {} };

        const jsonData = fs.readFileSync(themesFilePath, 'utf-8');
        return JSON.parse(jsonData);
    } catch (error) {
        console.error("[Main.js] Error loading themes JSON:", error);
        return { themes: {} };
    }
});

// removes a game from the data
ipcMain.handle('remove-game', async (event, gameID) => {
    try {
        let db = { };
        if (fs.existsSync(gamesFilePath)) {
            const fileData = fs.readFileSync(gamesFilePath, 'utf-8');
            db = JSON.parse(fileData);
        }

        delete db[gameID];

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
        let db = {};
        if (fs.existsSync(gamesFilePath)) {
            const fileData = fs.readFileSync(gamesFilePath, 'utf-8');
            db = JSON.parse(fileData);
        }

        // generates a new ID if not provided
        let gameID = gameData.id;
        if (!gameID) {
            // gets all existing game IDs and converts them to numbers
            const existingIDs = Object.keys(db).map(id => parseInt(id));
            
            // find the highest ID (0 if there are no games yet)
            const highestID = existingIDs.length > 0 ? Math.max(...existingIDs) : 0;
            
            // assign the next available ID
            gameID = (highestID + 1).toString();
}

        db[gameID] = {
            title: gameData.details.title,
            path: gameData.details.path,
            coverImage: gameData.details.coverImage,
            icon: gameData.details.icon,
            tags: gameData.details.tags,
            description: gameData.details.description
        };

        fs.writeFileSync(gamesFilePath, JSON.stringify(db, null, 4));
        return { success: true, id: gameID };
    } catch (error) {
        console.error("[Main.js] Error saving game data:", error);
        return { success: false, error: error.message };
    }
});

// updates an existing game
ipcMain.handle('update-game', async (event, gameID, newData) => {
    try {
        let db = {};
        if (fs.existsSync(gamesFilePath)) {
            const fileData = fs.readFileSync(gamesFilePath, 'utf-8');
            db = JSON.parse(fileData);
        }

        if (!db[gameID]) {
            return { success: false, error: 'Game not found' };
        }

        db[gameID] = {
            title: newData.title,
            path: newData.path,
            coverImage: newData.coverImage,
            icon: newData.icon,
            tags: newData.tags,
            description: newData.description
        };

        fs.writeFileSync(gamesFilePath, JSON.stringify(db, null, 4));

        return { success: true };
    } catch (err) {
        console.error('[Main.js] Error updating game:', err);
        return { success: false, error: err.message };
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

let history = ["./index.html"]
let historyIndex = 0

ipcMain.handle('change-page', async (event, page, addToHistory = true) => {
  const win = BrowserWindow.getFocusedWindow()
  if (!win) return

  if (addToHistory) {
    history = history.slice(0, historyIndex + 1)
    history.push(page)
    historyIndex = history.length - 1
  }

  const pagePath = path.join(__dirname, '..', page)
  await win.loadFile(pagePath)

  return { history, historyIndex }
})

ipcMain.handle('get-history', () => {
  return { history, historyIndex }
})

ipcMain.handle('navigate-history', async (event, direction) => {
  const win = BrowserWindow.getFocusedWindow()
  if (!win) return

  if (direction === 'back' && historyIndex > 0) {
    historyIndex--
  }

  if (direction === 'forward' && historyIndex < history.length - 1) {
    historyIndex++
  }

  const page = history[historyIndex]
  const pagePath = path.join(__dirname, '..', page)

  await win.loadFile(pagePath)

  return { history, historyIndex }
})

ipcMain.handle("get-current-page" , () => {
    return history[historyIndex] || null
})


// creates the main window
const createWindow = () => {
    const win = new BrowserWindow({
        width: 1000,
        height: 700,
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    win.loadFile(path.join(__dirname, '../index.html'));
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
let activeGames = new Map();

ipcMain.handle('launch-game', async (event, exePath) => {
  try {
    const finalPath = path.normalize(exePath);

    if (activeGames.has(finalPath)) {
        const process = activeGames.get(finalPath);
        try {
            process.kill(0); 
            console.log("The game is already running.");
            return { success: false, error: "Game is already running." };
        } catch (e) {
            activeGames.delete(finalPath);
        }
    }

    const gameDir = path.dirname(finalPath);

    const gameProcess = spawn(`"${finalPath}"`, [], {
      detached: true,
      stdio: 'ignore',
      shell: true,
      cwd: gameDir
    });

    activeGames.set(finalPath, gameProcess);
    
    gameProcess.on('exit', () => {
        activeGames.delete(finalPath);
        console.log("Game closed. Removed from active list.");
    });

    gameProcess.unref();
    return { success: true };

  } catch (err) {
    console.error('Launch error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('minimize-window', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.minimize();
});

ipcMain.handle('close-window', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.close();
});

ipcMain.handle('toggle-window-maximize', (event) => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return false;

    if (win.isMaximized()) {
        win.unmaximize();
        return false;
    } else {
        win.maximize();
        return true;
    }
});


// closes the app when all windows are closed (not macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

