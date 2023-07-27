
import { contextBridge, ipcRenderer } from 'electron';

let workerChannel: MessagePort;
let workerCallback: (data: object) => void|object;

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