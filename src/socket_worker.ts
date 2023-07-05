import { app, BrowserWindow, ipcRenderer } from 'electron';

import net from 'net';
import stream from 'node:stream';

console.log("socket worker started - socket_worker.ts");
const ports: MessagePort[] = [];
let tcpConnected = false;
let waitConnect = false;

function writeJsonOnSocket(json: any) {
    let jsonstr = JSON.stringify(json);
    let buf = Buffer.alloc(2);
    buf.writeUInt16BE(jsonstr.length);
    if (tcpConnected) {
        client.write(buf);
        client.write(jsonstr);
    }
}

async function socketloop() {
    while (1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        if (ports.length > 0) {
            writeJsonOnSocket({ type: "Status" });
        } else {
            console.log('No port');
        }

        if (!tcpConnected && !waitConnect) {
            waitConnect = true;
            client.connect(12123, '127.0.0.1', function () {
                streambuf.read();    /* Clean Streambuf */
                console.log('TCP Connected');
                ports.forEach(port => { port.postMessage({ type: "TcpOnConnect" }) });

                tcpConnected = true;
                waitConnect = false;
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

// if (!waitConnect) {
//     client.connect(12123, '127.0.0.1', function () {
//         console.log('TCP Connected');
//         ports.forEach(port => port.postMessage({ type: "TcpOnConnect" }));
//         tcpConnected = true;
//     });
//     waitConnect = true;
// }

client.setTimeout(3000);

client.on('timeout', function () {
    console.log('Socket Timeout');
    client.end();
    tcpConnected = false;
    waitConnect = false;

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
    tcpConnected = false;
    waitConnect = false;
    streambuf.read();    /* Clean Streambuf */
});

client.on('close', function () {
    tcpConnected = false;
    console.log('Connection closed... Retry');
    waitConnect = false;
    streambuf.read();    /* Clean Streambuf */
});

socketloop();