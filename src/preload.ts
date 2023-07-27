
import { contextBridge, ipcRenderer } from 'electron';
interface ElectronAPI {
    requestWorkerChannel: (callback: (data: object) => void) => void;
    sendWorkerChannel: (data: object) => void;
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}

let workerChannel: MessagePort;
let workerCallback: (data: object) => object | void = (d) => {
    console.log("No worker callback", d)
};

ipcRenderer.on('provide-worker-channel', (event) => {
    workerChannel = event.ports[0];
    workerChannel.onmessage = (event: MessageEvent) => {
        const reply = workerCallback(event.data);
        if (reply)
            workerChannel.postMessage(reply);
    };
});

contextBridge.exposeInMainWorld('electronAPI', {
    requestWorkerChannel: (callback: (data: object) => void
    ) => {
        ipcRenderer.send('request-worker-channel');
        workerCallback = callback;
    },
    sendWorkerChannel: (data: object) => {
        if (workerChannel)
            workerChannel.postMessage(data);
    }
});