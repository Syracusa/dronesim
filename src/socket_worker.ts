import { app, BrowserWindow } from 'electron';

console.log("socket worker started - socket_worker.ts");

socketloop();

async function socketloop() {
    while (1)
    {
        console.log("socket worker loop");
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}