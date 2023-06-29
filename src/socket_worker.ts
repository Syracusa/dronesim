import { app, BrowserWindow, ipcRenderer } from 'electron';

console.log("socket worker started - socket_worker.ts");
let port: MessagePort;

ipcRenderer.on('new-client', (event) => {
    console.log(event.ports);
    port = event.ports[0]
    port.postMessage('init');
    port.onmessage = (event) => {
        console.log('socket worker received message:', event.data)
    }
})

/* Open TCP Connection to server */
import net from 'net';
import stream from 'node:stream';

const streambuf = new stream.PassThrough();

const client = new net.Socket();
client.connect(12123, '127.0.0.1', function () {
    console.log('TCP Connected');
});

client.on('data', function (data) {
    streambuf.write(data);

    while (streambuf.readableLength >= 2) {
        let buf = streambuf.read(2);
        let len = buf.readUInt16BE();
        if (streambuf.readableLength >= len) {
            let json = JSON.parse(streambuf.read(len));
            console.log(json);
        } else {
            streambuf.unshift(buf);
            break;
        } 
    }
});

client.on('close', function () {
    console.log('Connection closed');
});

socketloop();

function writeJsonOnSocket(json: any) {
    let jsonstr = JSON.stringify(json);
    let buf = Buffer.alloc(2);
    buf.writeUInt16BE(jsonstr.length);
    client.write(buf);
    client.write(jsonstr);
}

async function socketloop() {
    while (1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (port) {
            port.postMessage({ test: 42 });
            writeJsonOnSocket({type: "Test"});
        } else {
            console.log('No port');
        }
    }
}