import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { NodeManager } from "./NodeManager";

export class ServerConnection {
    static workerConnected = false;
    nodeManager: NodeManager;
    linkInfoIntervalMs: number = 2000;
    shouldStart = true;

    constructor(nodeManager: NodeManager) {
        this.nodeManager = nodeManager;

        window.electronAPI.requestWorkerChannel((data: any) => {
            ServerConnection.workerConnected = true;
            this.handleWorkerMessage(data);
        });

        ServerConnection.waitWorkerConnection(this);

        this.backgroundWork();
    }

    backgroundWork() {
        const that = this;
        this.sendNodeLinkState();
        if (this.shouldStart) {
            this.sendStartSimulation();
            this.shouldStart = false;
        }
        setTimeout(() => {
            that.backgroundWork();
        }, that.linkInfoIntervalMs);
    }

    static async waitWorkerConnection(that: ServerConnection) {
        while (!ServerConnection.workerConnected) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        that.shouldStart = true;
    }

    handleWorkerMessage(data: any) {
        if (data.hasOwnProperty("type")) {

            switch (data.type) {
                case "TcpOnConnect":
                    console.log("TCP connected");
                    this.shouldStart = true;
                    break;
                case "TRx":
                    {
                        const node = this.nodeManager.nodeList[data.node];
                        node.txBytes = data.tx;
                        node.rxBytes = data.rx;
                        node.guiInfoDirty = true;
                    }
                    break;
                case "Status":
                    break;
                case "Route":
                    {
                        const node = this.nodeManager.nodeList[data.node];
                        const routeEntry = node.routingTable[data.target];
                        routeEntry.hopCount = data.hopcount;
                        routeEntry.path = data.path;
                        node.guiInfoDirty = true;

                        // this.nodeManager.calcRelayNode();
                    }
                    break;
                default:
                    console.log("Unknown message type from worker " + data.type);
                    break;
            }

        }
    }

    sendtoServer(json: any) {
        window.electronAPI.sendWorkerChannel(json);
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