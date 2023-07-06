import { app, BrowserWindow, MessageChannelMain, Tray, Menu, nativeImage } from 'electron';

import TreeImg from './static/Tree.png.resource';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

declare const SOCKET_WORKER_WEBPACK_ENTRY: string;

declare const ANALYZER_WEBPACK_ENTRY: string;
declare const ANALYZER_PRELOAD_WEBPACK_ENTRY: string;

if (require('electron-squirrel-startup')) {
    app.quit();
}

console.log("main worker started");
const createWindow = (): void => {

    /* ===== Main Window ===== */
    const mainWindow = new BrowserWindow({
        height: 600,
        width: 800,
        webPreferences: {
            preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
        },
    });

    mainWindow.webContents.openDevTools();
    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

    /* ===== Analyzer Window ===== */
    const analyzerWindow = new BrowserWindow({
        height: 600,
        width: 800,
        webPreferences: {
            preload: ANALYZER_PRELOAD_WEBPACK_ENTRY,
        },
    });

    console.log(ANALYZER_WEBPACK_ENTRY);
    analyzerWindow.loadURL(ANALYZER_WEBPACK_ENTRY);
    analyzerWindow.webContents.openDevTools();
    // analyzerWindow.hide();

    /* ===== Worker Window ===== */
    const showWorker = true;
    const worker = new BrowserWindow({
        show: showWorker,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true
        }
    });
    if (showWorker) {
        worker.webContents.openDevTools();
    }
    worker.loadURL(SOCKET_WORKER_WEBPACK_ENTRY);
    // worker.minimize();
    // worker.hide();


    /* ===== IPC Handler ===== */
    mainWindow.webContents.mainFrame.ipc.on('request-worker-channel', (event) => {
        console.log('Main port request');
        const { port1, port2 } = new MessageChannelMain();
        worker.webContents.postMessage('new-client', null, [port1]);
        event.senderFrame.postMessage('provide-worker-channel', null, [port2]);
    });

    analyzerWindow.webContents.mainFrame.ipc.on('request-worker-channel', (event) => {
        console.log('Analyzer port request');
        const { port1, port2 } = new MessageChannelMain();
        worker.webContents.postMessage('new-client', null, [port1]);
        event.senderFrame.postMessage('provide-worker-channel', null, [port2]);
    });

    /* ===== Tray ===== */
    const tray = new Tray(nativeImage.createFromBuffer(Buffer.from(TreeImg)));
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Item1', type: 'radio' },
        { label: 'Item2', type: 'radio' },
        { label: 'Item3', type: 'radio', checked: true },
        { label: 'Item4', type: 'radio' }
    ]);
    tray.setToolTip('Tray test');
    tray.setContextMenu(contextMenu);
};

app.on('ready', createWindow);

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
