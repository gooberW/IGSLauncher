const { app, BrowserWindow, ipcMain, protocol, net, dialog } = require('electron');
const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');
const { pathToFileURL } = require('url');

const userDataDir = path.join(app.getPath('userData'), 'data');
const gamesFilePath = path.join(userDataDir, 'games.json');
const themesFilePath = path.join(__dirname, '../data/themes.json');


// this adds support for local resources (needed for images)
protocol.registerSchemesAsPrivileged([
  { scheme: 'local-resource', privileges: { standard: true, secure: true, supportFetchAPI: true, bypassCSP: true } }
]);


function ensureUserDataFiles() {
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  if (!fs.existsSync(gamesFilePath)) {
    fs.writeFileSync(gamesFilePath, '{}');
  }

  if (!fs.existsSync(themesFilePath)) {
    fs.writeFileSync(themesFilePath, '{}');
  }
}


// reads the games.json file
ipcMain.handle('get-games-data', async () => {
    try {
        if (!fs.existsSync(gamesFilePath)) return { };
        const jsonData = fs.readFileSync(gamesFilePath, 'utf-8');
        return JSON.parse(jsonData);
    } catch (error) {
        console.error("[Main.js] Error loading games data:", error);
        return { };
    }
});

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
            developers: gameData.details.developers,
            publishers: gameData.details.publishers,
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
            developers: newData.developers,
            publishers: newData.publishers,
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

// calculates the size of the game installation folder (this needs to be fixed)
ipcMain.handle('get-install-size', async (event, exePath) => {
    try {
        if (typeof exePath !== 'string' || exePath.trim() === '') {
            return { success: false, error: 'Invalid executable path' };
        }

        const normalizedPath = path.normalize(exePath);
        
        // verifies the executable exists
        if (!fs.existsSync(normalizedPath)) {
            return { success: false, error: 'Executable not found' };
        }

        // gets the directory containing the executable
        const gameDir = path.dirname(normalizedPath);
        
        // recursively calculates directory size
        async function getDirectorySize(dirPath, maxDepth = 10, currentDepth = 0) {
            let totalSize = 0;
            
            // prevents infinite recursion and excessive depth
            if (currentDepth > maxDepth) {
                console.warn(`Max depth reached at: ${dirPath}`);
                return totalSize;
            }
            
            try {
                const items = await fs.promises.readdir(dirPath, { withFileTypes: true });
                
                // processes files and directories
                const promises = items.map(async (item) => {
                    const itemPath = path.join(dirPath, item.name);
                    
                    try {
                        if (item.isDirectory()) {
                            // skips common large/unnecessary directories
                            const skipDirs = ['node_modules', '.git', '__pycache__', 'cache', 'temp'];
                            if (skipDirs.includes(item.name.toLowerCase())) {
                                return 0;
                            }
                            return await getDirectorySize(itemPath, maxDepth, currentDepth + 1);
                        } else if (item.isFile()) {
                            const stats = await fs.promises.stat(itemPath);
                            return stats.size;
                        } else if (item.isSymbolicLink()) {
                            // skips symbolic links to avoid circular references
                            return 0;
                        }
                    } catch (err) {
                        // skips files/dirs we can't access (permissions, etc)
                        console.warn(`Could not access: ${itemPath}`, err.message);
                        return 0;
                    }
                    
                    return 0;
                });
                
                const sizes = await Promise.all(promises);
                totalSize = sizes.reduce((sum, size) => sum + size, 0);
                
            } catch (err) {
                console.error(`Error reading directory ${dirPath}:`, err.message);
            }
            
            return totalSize;
        }
        
        console.log(`Calculating install size for: ${gameDir}`);
        const startTime = Date.now();
        
        const totalSize = await getDirectorySize(gameDir);
        
        const endTime = Date.now();
        console.log(`Size calculation completed in ${endTime - startTime}ms: ${totalSize} bytes`);

        return {
            success: true,
            size: totalSize
        };
    } catch (error) {
        console.error('[Main.js] Error getting installation size:', error);
        return {
            success: false,
            error: error.message
        };
    }
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
        width: 1280,
        height: 720,
        show: false,
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    const splash = new BrowserWindow({
        width: 500,
        height: 300,
        show: true,
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        alwaysOnTop: true,
        skipTaskbar: true
    });

    win.loadFile(path.join(__dirname, '../index.html'));
    splash.loadFile(path.join(__dirname, '../splash.html'));

    splash.center();
    win.center();

    
    setTimeout(function () {
        splash.close();
        win.show();
        }, 3000)
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
  ensureUserDataFiles();
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

