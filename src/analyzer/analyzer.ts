import { NodeInfoDiv } from "./NodeInfoDiv";
import TestHTML from "./test.html.resource";

export class Analyzer {
    nodeInfoDivArray = new Array<NodeInfoDiv>(128).fill(null);
    workerConnected = false;

    constructor() {
        this.initIPC();
        document.body.appendChild(this.createStreamConfigButton());
    }

    createStreamConfigButton() {
        const button = document.createElement("button");
        button.innerText = "Stream Config";
        button.onclick = this.openDummyStreamConfigWindow;
        return button;
    }


    static array2str(data : Uint8Array) {
        let i, str = '';

        for (i = 0; i < data.length; i++) {
            str += '%' + ('0' + data[i].toString(16)).slice(-2);
        }

        return decodeURIComponent(str);
    }

    openDummyStreamConfigWindow() {
        console.log(TestHTML);
        const data = TestHTML.data as Uint8Array;
        console.log(data.toString());

        const childWindow = window.open('', '');
        childWindow.document.write(Analyzer.array2str(data));
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