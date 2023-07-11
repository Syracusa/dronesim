
import { contextBridge, ipcRenderer } from 'electron';

let workerChannel: MessagePort;
let workerCallback: (data: any) => any = (d) => {
    console.log("No worker callback")
};

ipcRenderer.on('provide-worker-channel', (event) => {
    workerChannel = event.ports[0];
    workerChannel.onmessage = (event: MessageEvent) => {
        let reply = workerCallback(event.data);
        if (reply)
            workerChannel.postMessage(reply);
    };
});

contextBridge.exposeInMainWorld('electronAPI', {
    requestWorkerChannel: (callback: (data: any) => void
    ) => {
        ipcRenderer.send('request-worker-channel');
        workerCallback = callback;
    },
    sendWorkerChannel: (data: any) => {
        if (workerChannel)
            workerChannel.postMessage(data);
    }
});