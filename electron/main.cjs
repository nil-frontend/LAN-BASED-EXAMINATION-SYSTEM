     const { app, BrowserWindow } = require('electron');
     const path = require('path');

     let mainWindow;

     function createWindow() {
       mainWindow = new BrowserWindow({
         width: 1200,
         height: 800,
         webPreferences: {
           nodeIntegration: true,
           contextIsolation: false,
           enableRemoteModule: true,
           webSecurity: false
         }
       });

       // Load the React app's index.html
      //  mainWindow.loadURL(
      //    process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../dist/index.html')}`
      //  );
      // mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
      mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));

       mainWindow.on('closed', () => {
         mainWindow = null;
       });
     }

     app.on('ready', createWindow);

     app.on('window-all-closed', () => {
       if (process.platform !== 'darwin') {
         app.quit();
       }
     });

     app.on('activate', () => {
       if (mainWindow === null) {
         createWindow();
       }
     });