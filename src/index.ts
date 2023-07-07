import { app, BrowserWindow, MessageChannelMain, Tray, Menu, nativeImage, NativeImage } from 'electron';
import IconResource from './static/icon.resource';

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
        width: 1280,
        webPreferences: {
            preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
        },
        autoHideMenuBar: true,
    });

    mainWindow.webContents.openDevTools();
    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

    mainWindow.on('close', (event) => {
        analyzerWindow.destroy();
        worker.destroy();
        app.exit();
    });

    /* ===== Analyzer Window ===== */
    const analyzerWindow = new BrowserWindow({
        height: 600,
        width: 1280,
        webPreferences: {
            preload: ANALYZER_PRELOAD_WEBPACK_ENTRY,
        },
        autoHideMenuBar: true,
        x: 10,
        y: 10,
    });

    analyzerWindow.loadURL(ANALYZER_WEBPACK_ENTRY);
    analyzerWindow.webContents.openDevTools();
    analyzerWindow.hide();

    analyzerWindow.on('close', (event) => {
        event.preventDefault();
        analyzerWindow.hide();
    });

    /* ===== Worker Window ===== */
    const worker = new BrowserWindow({
        show: true,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true
        },
        autoHideMenuBar: true,
        x: 30,
        y: 30,
    });

    worker.loadURL(SOCKET_WORKER_WEBPACK_ENTRY);
    worker.webContents.openDevTools();
    worker.hide();

    worker.on('close', (event) => {
        event.preventDefault();
        worker.hide();
    });

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

    const array2str = (data: Uint8Array) => {
        let i, str = '';
        for (i = 0; i < data.length; i++)
            str += '%' + ('0' + data[i].toString(16)).slice(-2);

        return decodeURIComponent(str);
    }
    const dataUrl = array2str(IconResource.data as Uint8Array);
    const icon = nativeImage.createFromDataURL(dataUrl);

    const tray = new Tray(icon)
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Show socket debug panel', type: 'normal', click: () => { worker.show(); } },
        { label: 'Show analyzer', type: 'normal', click: () => { analyzerWindow.show(); } },
    ]);
    tray.setToolTip('Tray test');
    tray.setContextMenu(contextMenu);
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    console.log('window-all-closed');
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
