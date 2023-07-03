import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { DroneManager, DroneMetadata } from "./DroneManager";

export class ServerConnection {
    static workerConnected = false;
    droneManager: DroneManager;
    linkInfoIntervalMs: number = 2000;
    shouldStart = true;

    constructor(droneManager: DroneManager) {
        this.droneManager = droneManager;

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
                    // console.log(data);
                    {
                        const drone = this.droneManager.droneList[data.node];
                        const dronemeta = drone.metadata as DroneMetadata;
                        dronemeta.txBytes = data.tx;
                        dronemeta.rxBytes = data.rx;
                        dronemeta.dirty = true;
                    }
                    break;
                case "Status":
                    // console.log(data);
                    break;
                case "Route":
                    console.log(data);
                    {
                        const drone = this.droneManager.droneList[data.node];
                        const dronemeta = drone.metadata as DroneMetadata;
                        const routeEntry = dronemeta.routingTable[data.target];
                        routeEntry.hopCount = data.hopcount;
                        routeEntry.path = data.path;
                        dronemeta.dirty = true;
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
        const dronenum = this.droneManager.droneList.length;
        const nodeLinkInfo: number[][] = [];
        for (let i = 0; i < dronenum; i++) {
            let oneNodeLinkInfo: number[] = [];
            for (let j = i + 1; j < dronenum; j++) {
                const drone1 = this.droneManager.droneList[i];
                const drone2 = this.droneManager.droneList[j];
                const distance = BABYLON.Vector3.Distance(drone1.position, drone2.position);
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
        console.log("send start simulation");
        let json = {
            type: "Start",
            nodenum: this.droneManager.droneList.length
        }
        this.sendtoServer(json);
        this.sendNodeLinkState();
    }
}