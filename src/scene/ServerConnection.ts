import { DroneManager } from "./DroneManager";

export class ServerConnection {
    static workerConnected = false;
    droneManager: DroneManager;

    constructor(droneManager: DroneManager) {
        this.droneManager = droneManager;

        window.electronAPI.requestWorkerChannel((data: any) => {
            ServerConnection.workerConnected = true;
            console.log('From worker:');
            console.log(data);
        });

        ServerConnection.waitWorkerConnection(this);
        // this.sendStartSimulation();
    }

    static async waitWorkerConnection(that: ServerConnection) {
        while (!ServerConnection.workerConnected) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        console.log("worker connected");
        that.sendStartSimulation();
    }

    sendtoServer(json: any) {
        window.electronAPI.sendWorkerChannel(json);
    }

    sendNodeLinkState() {

    }

    sendStartSimulation() {
        console.log("send start simulation");
        let json = {
            type: "Start",
            nodenum: this.droneManager.droneList.length
        }
        this.sendtoServer(json);
    }
}