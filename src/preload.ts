
import { contextBridge, ipcRenderer } from 'electron';

let workerChannel: MessagePort;
let workerCallback: (data: any) => any;

ipcRenderer.on('provide-worker-channel', (event) => {
    workerChannel = event.ports[0];
    workerChannel.onmessage = (event: MessageEvent) => {
        let reply = workerCallback(event.data);
        workerChannel.postMessage(reply);
    };
});

contextBridge.exposeInMainWorld('electronAPI', {
    requestWorkerChannel: (callback: (data: any) => void
    ) => {
        ipcRenderer.send('request-worker-channel');
        workerCallback = callback;
    }
})