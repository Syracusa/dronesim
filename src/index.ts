import { app, BrowserWindow, MessageChannelMain } from 'electron';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

declare const SOCKET_WORKER_WEBPACK_ENTRY: string;

if (require('electron-squirrel-startup')) {
  app.quit();
}

console.log("main worker started");
const createWindow = (): void => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  // and load the index.html of the app.
  console.log(MAIN_WINDOW_WEBPACK_ENTRY);
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  const worker = new BrowserWindow({
    // show: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true
    }
  })
  worker.webContents.openDevTools();
  console.log(SOCKET_WORKER_WEBPACK_ENTRY);
  worker.loadURL(SOCKET_WORKER_WEBPACK_ENTRY)

  console.log("test");
  mainWindow.webContents.mainFrame.ipc.on('request-worker-channel', (event) => {
    const { port1, port2 } = new MessageChannelMain()
    worker.webContents.postMessage('new-client', null, [port1])
    event.senderFrame.postMessage('provide-worker-channel', null, [port2])
  })
};

app.on('ready', createWindow)

app.whenReady().then(async () => {});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
