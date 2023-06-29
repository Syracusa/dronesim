import { app, BrowserWindow, ipcRenderer } from 'electron';

console.log("socket worker started - socket_worker.ts");
let port: MessagePort;

// We might get multiple clients, for instance if there are multiple windows,
// or if the main window reloads.
ipcRenderer.on('new-client', (event) => {
    console.log(event.ports);
    port = event.ports[0]
    port.onmessage = (event) => {
        // console.log('socket worker received message:', event.data)
    }
})


/* Open TCP Connection to server */
import net from 'net';

const client = new net.Socket();
client.connect(12123, '127.0.0.1', function() {
	console.log('TCP Connected');
});

client.on('data', function(data) {
	console.log('Received: ' + data);
});

client.on('close', function() {
	console.log('Connection closed');
});

socketloop();

async function socketloop() {
    while (1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (port) {
            port.postMessage({ test: 42 });
            client.write('Hello, server!!');
        }
    }
}