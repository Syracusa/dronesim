import { NodeInfoDiv } from "./NodeInfoDiv";
import DummyConfigHtmlResource from "./dummyconfig.html.resource";
import { TRxMsg, RouteMsg } from "../JsonMsg";

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
        for (i = 0; i < data.length; i++) 
            str += '%' + ('0' + data[i].toString(16)).slice(-2);
        
        return decodeURIComponent(str);
    }

    openDummyStreamConfigWindow() {
        const childWindow = window.open('', '');
        const data = DummyConfigHtmlResource.data as Uint8Array;
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

    handleTRxInfo(data: TRxMsg) {
        const infoDiv = this.getNodeInfoDiv(data.node);
        infoDiv.txbytes = data.tx;
        infoDiv.rxbytes = data.rx;
        infoDiv.updateText();
    }

    handleRouteInfo(data: RouteMsg) {
        /* Do something */
        // const infoDiv = this.getNodeInfoDiv(data.node);
    }

    handleWorkerMessage(data: object) {
        if (Object.prototype.hasOwnProperty.call(data, "type")) {
            const typed = data as { type: string };
            switch (typed.type) {
                case "TcpOnConnect":
                    console.log("TCP connected");
                    break;
                case "TRx":
                    this.handleTRxInfo(data as TRxMsg);
                    break;
                case "Status":
                    // Do nothing
                    break;
                case "Route":
                    this.handleRouteInfo(data as RouteMsg);
                    break;
                default:
                    console.log("Unknown message type from worker " + typed.type);
                    break;
            }
        }
    }

    initIPC() {
        window.electronAPI.requestWorkerChannel((data: any) => {
            this.workerConnected = true;
            this.handleWorkerMessage(data);
        });
    }
}