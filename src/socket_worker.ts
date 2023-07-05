import { app, BrowserWindow, ipcRenderer } from 'electron';

import net from 'net';
import stream from 'node:stream';

console.log("socket worker started - socket_worker.ts");
const ports: MessagePort[] = [];
let tcpConnected = false;

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
        if (ports.length > 0) {
            writeJsonOnSocket({ type: "Status" });
        } else {
            console.log('No port');
        }
        if (!tcpConnected) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            client.connect(12123, '127.0.0.1', function () {
                console.log('TCP Reconnected');
                ports.forEach(port => { port.postMessage({type: "TcpOnConnect"})});
               
                tcpConnected = true;
            });
        }
    }
}

ipcRenderer.on('new-client', (event) => {
    console.log(event.ports);
    const port = event.ports[0];
    ports.push(port);

    port.postMessage('init');
    port.onmessage = (event) => {
        console.log('socket worker received message:', event.data)
        writeJsonOnSocket(event.data);
    }
});

/* Open TCP Connection to server */
const streambuf = new stream.PassThrough();
const client = new net.Socket();
client.connect(12123, '127.0.0.1', function () {
    console.log('TCP Connected');
    ports.forEach(port => port.postMessage({type: "TcpOnConnect"}));
    tcpConnected = true;
});

client.setTimeout(3000);

client.on('timeout', function () {
    console.log('Socket Timeout');
    client.end();
    tcpConnected = false;
});

client.on('data', function (data) {
    streambuf.write(data);

    while (streambuf.readableLength >= 2) {
        let buf = streambuf.read(2);
        let len = buf.readUInt16BE();
        if (streambuf.readableLength >= len) {
            let json = JSON.parse(streambuf.read(len));
            ports.forEach(port => port.postMessage(json));
        } else {
            streambuf.unshift(buf);
            break;
        }
    }
});

client.on('close', function () {
    tcpConnected = false;
    console.log('Connection closed... Retry');
});

socketloop();