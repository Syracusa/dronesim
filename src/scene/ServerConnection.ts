import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { NodeManager } from "./NodeManager";

export class ServerConnection {
    private workerConnected = false;
    private tcpConnected = false;
    private readonly linkInfoIntervalMs: number = 2000;

    constructor(private readonly nodeManager: NodeManager) {
        this.nodeManager = nodeManager;
        window.electronAPI.requestWorkerChannel((data: any) => {
            this.workerConnected = true;
            this.handleWorkerMessage(data);
        });

        this.backgroundWork();
    }

    backgroundWork() {
        this.sendNodeLinkState();
        setTimeout(() => {
            this.backgroundWork();
        }, this.linkInfoIntervalMs);
    }

    private handleTRxMsg(data: any) {
        const node = this.nodeManager.nodeList[data.node];
        node.txBytes = data.tx;
        node.rxBytes = data.rx;
        node.guiInfoDirty = true;
    }

    private handleRouteMsg(data: any){
        const node = this.nodeManager.nodeList[data.node];
        const routeEntry = node.routingTable[data.target];
        routeEntry.hopCount = data.hopcount;
        routeEntry.path = data.path;
        node.guiInfoDirty = true;
    }

    handleWorkerMessage(data: any) {
        if (data.hasOwnProperty("type")) {
            switch (data.type) {
                case "TcpOnConnect":
                    console.log("TCP connected");
                    this.tcpConnected = true;
                    break;
                case "TcpOnClose":
                    console.log("TCP closed");
                    this.tcpConnected = false;
                    break;
                case "TRx":
                    this.handleTRxMsg(data);
                    break;
                case "Status":
                    break;
                case "Route":
                    this.handleRouteMsg(data);
                    break;
                default:
                    console.log("Unknown message type from worker " + data.type);
                    break;
            }
        }
    }

    sendtoServer(json: any) {
        if (!this.tcpConnected){
            console.log('TCP not connected, drop message');
            console.log(json);
            return;
        }
        if (!this.workerConnected) {
            console.log('Worker not connected, drop message');
            return;
        }
        window.electronAPI.sendWorkerChannel(json);
    }

    sendHeartbeat() {
        this.sendtoServer({ type: "Heartbeat" });
    }

    sendNodeLinkState() {
        const nodenum = this.nodeManager.nodeList.length;
        const nodeLinkInfo: number[][] = [];
        for (let i = 0; i < nodenum; i++) {
            let oneNodeLinkInfo: number[] = [];
            for (let j = i + 1; j < nodenum; j++) {
                const node1 = this.nodeManager.nodeList[i];
                const node2 = this.nodeManager.nodeList[j];
                const distance = BABYLON.Vector3.Distance(
                    node1.getPosition(),
                    node2.getPosition());
                oneNodeLinkInfo.push(parseFloat(distance.toFixed(2)));
            }
            nodeLinkInfo.push(oneNodeLinkInfo);
        }
        let json = {
            type: "LinkInfo",
            links: nodeLinkInfo
        }
        this.sendtoServer(json);
    }

    sendStartSimulation() {
        console.log("Send start simulation");
        let json = {
            type: "Start",
            nodenum: this.nodeManager.nodeList.length
        }
        this.sendtoServer(json);
        this.sendNodeLinkState();
    }
}