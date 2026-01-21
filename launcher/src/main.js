const { app, BrowserWindow, ipcMain, protocol, net } = require('electron')

const fs = require('fs');
const path = require('path');

// reads the JSON and saves the data so it can be used in the renderer.
ipcMain.handle('get-games-data', async () => {
    const filePath = path.join(__dirname, 'data/games.json'); 
    const jsonData = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(jsonData);
});

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
        nodeIntegration: true,
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true
    }
  })

  win.loadFile(path.join(__dirname, 'index.html'));
  //win.removeMenu();
}

app.whenReady().then(() => {
    protocol.handle('local-resource', async (request) => {
        try {
            const url = request.url.replace('local-resource://', '');
            const decodedUrl = decodeURIComponent(url);

            return await net.fetch(decodedUrl);
        } catch (error) {
            console.error('Failed to handle protocol request:', error);
            return new Response('Failed to load resource', { status: 500 });
        }
    });

    createWindow();
});


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

