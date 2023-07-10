import { ipcRenderer } from 'electron';
import net from 'net';
import stream from 'node:stream';

class SocketWorker {
    jsonIo = new JsonIoClient();
    ports: MessagePort[] = [];

    constructor() {
        const that = this;
        this.jsonIo.onJsonRecv = (json) => {
            that.ports.forEach(port => port.postMessage(json));
        };
        this.jsonIo.onConnect = () => {
            console.log('Server connected');
            that.ports.forEach(port => {
                port.postMessage({ type: "TcpOnConnect" })
            });
        }

        ipcRenderer.on('new-client', (event) => {
            const port = event.ports[0];
            console.log('New socket listener.');
            that.ports.push(port);

            port.onmessage = (event) => {
                that.jsonIo.sendJsonTcp(event.data);
            }
        });

        this.jsonIo.start();
    }
}

class JsonIoClient {
    tcpClient = new TcpClient();
    streambuf = new stream.PassThrough();

    onJsonRecv: (json: any) => void = (d) => {
        console.log('No JSON handler');
    };
    onConnect: () => void = () => {
        console.log('JsonIoClient - Server connected');
    };

    constructor() {
        const that = this;
        this.tcpClient.onData = (data) => {
            that.recvDataCallback(data);
        };
        this.tcpClient.onConnect = () => {
            that.streambuf.read(); /* clear buffer */
            that.onConnect();
        }
    }

    start() {
        this.tcpClient.start();
    }

    sendJsonTcp(json: any) {
        const jsonstr = JSON.stringify(json);
        const buf = Buffer.alloc(2);
        buf.writeUInt16BE(jsonstr.length);

        this.tcpClient.send(buf);
        this.tcpClient.send(jsonstr);
    }

    recvDataCallback(data: Buffer) {
        const streambuf = this.streambuf;
        streambuf.write(data);

        while (streambuf.readableLength >= 2) {
            let buf = streambuf.read(2);
            let len = buf.readUInt16BE();
            if (streambuf.readableLength >= len) {
                try {
                    let json = JSON.parse(streambuf.read(len));
                    this.onJsonRecv(json);
                }
                catch (e) {
                    console.log('Fail to parse JSON');
                }
            } else {
                streambuf.unshift(buf);
                break;
            }
        }
    }
}

class TcpClient {
    socket: net.Socket = this.createSocket();
    serverAddr: string = '127.0.0.1';
    serverPort: number = 12123;
    onData: (data: any) => void = (d) => {
        console.log('No data handler');
    };
    onConnect: () => void = () => {
        console.log('TcpClient - Server connected');
    };

    constructor(serverAddr?: string, serverPort?: number) {
        if (serverAddr && serverPort) {
            this.serverAddr = serverAddr;
            this.serverPort = serverPort;
        }
    }

    createSocket() {
        const that = this;
        const socket = new net.Socket();
        socket.setTimeout(3000);

        socket.on('timeout', function () {
            console.log('Socket Timeout');
            socket.destroy();
        });

        socket.on('data', (data) => {
            that.onData(data);
        });

        socket.on('error', function (err) {
            console.log('Socket Error: ' + err);
        });

        socket.on('close', function () {
            console.log('Connection closed...');
        });

        return socket;
    }

    send(data: Buffer | string) {
        if (!this.socket.closed)
            this.socket.write(data);
        else
            console.log('TCP not connected');
    }

    async start() {
        const socket = this.socket;
        while (1) {
            if (socket.closed) {
                console.log('Try connect...');
                socket.removeAllListeners('connect');
                socket.connect(12123, '127.0.0.1', this.onConnect);
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
}

new SocketWorker();