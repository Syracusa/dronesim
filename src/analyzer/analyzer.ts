import { NodeInfoDiv } from "./NodeInfoDiv";


export class Analyzer {
    nodeInfoDivArray = new Array<NodeInfoDiv>(128).fill(null);
    workerConnected = false;

    constructor() {
        this.initIPC();
    }

    getNodeInfoDiv(nodeId: number) {
        let infoDiv = this.nodeInfoDivArray[nodeId];
        if (!infoDiv) {
            infoDiv = new NodeInfoDiv(nodeId);
            this.nodeInfoDivArray[nodeId] = infoDiv;
            infoDiv.attachTo(document.body);
        }
        return infoDiv;
    }

    handleTRxInfo(data: any) {
        const infoDiv = this.getNodeInfoDiv(data.node);
        infoDiv.txbytes = data.tx;
        infoDiv.rxbytes = data.rx;
        infoDiv.updateText();
    }

    handleRouteInfo(data: any) {
        const infoDiv = this.getNodeInfoDiv(data.node);
        /* Do something */
    }

    handleWorkerMessage(data: any) {
        if (data.hasOwnProperty("type")) {
            switch (data.type) {
                case "TcpOnConnect":
                    console.log("TCP connected");
                    break;
                case "TRx":
                    this.handleTRxInfo(data);
                    break;
                case "Status":
                    // Do nothing
                    break;
                case "Route":
                    this.handleRouteInfo(data);
                    break;
                default:
                    console.log("Unknown message type from worker " + data.type);
                    break;
            }
        }
    }
    
    initIPC() {
        const that = this;
        window.electronAPI.requestWorkerChannel((data: any) => {
            that.workerConnected = true;
            that.handleWorkerMessage(data);
        });
    }
}