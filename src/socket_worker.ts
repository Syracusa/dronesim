import { app, BrowserWindow, ipcRenderer } from 'electron';

import net from 'net';
import stream from 'node:stream';

console.log("socket worker started - socket_worker.ts");
const ports: MessagePort[] = [];

/* Open TCP Connection to server */
const streambuf = new stream.PassThrough();
const client = new net.Socket();

socketloop();

function writeJsonOnSocket(json: any) {
    let jsonstr = JSON.stringify(json);
    let buf = Buffer.alloc(2);
    buf.writeUInt16BE(jsonstr.length);
    if (!client.closed) {
        client.write(buf);
        client.write(jsonstr);
    } else {
        console.log('TCP not connected');
    }
}

function tcpOnConnect() {
    streambuf.read();    /* Clean Streambuf */
    console.log('TCP Connected');
    ports.forEach(port => { port.postMessage({ type: "TcpOnConnect" }) });
}

async function socketloop() {
    while (1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        if (ports.length > 0) {
            writeJsonOnSocket({ type: "Status" });
        } else {
            console.log('No port');
        }

        if (client.closed) {
            streambuf.read();    /* Clean Streambuf */
            // client.removeAllListeners();
            client.removeListener('connect', tcpOnConnect);
            client.connect(12123, '127.0.0.1', tcpOnConnect);
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

client.setTimeout(3000);

client.on('timeout', function () {
    console.log('Socket Timeout');
    streambuf.read();    /* Clean Streambuf */
});

client.on('data', function (data) {
    streambuf.write(data);

    while (streambuf.readableLength >= 2) {
        let buf = streambuf.read(2);
        let len = buf.readUInt16BE();
        if (streambuf.readableLength >= len) {
            try {
                let json = JSON.parse(streambuf.read(len));
                ports.forEach(port => port.postMessage(json));
            }
            catch (e) {
                console.log('Fail to parse JSON');
            }
        } else {
            streambuf.unshift(buf);
            break;
        }
    }
});

client.on('error', function (err) {
    console.log('Socket Error: ' + err);
    streambuf.read();    /* Clean Streambuf */
});

client.on('close', function () {
    console.log('Connection closed...');
    client.destroy();
    streambuf.read();    /* Clean Streambuf */
});
