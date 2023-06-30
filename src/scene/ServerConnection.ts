import { DroneManager } from "./DroneManager";

export class ServerConnection {
    static workerConnected = false;
    droneManager: DroneManager;

    constructor(droneManager: DroneManager) {
        this.droneManager = droneManager;

        window.electronAPI.requestWorkerChannel((data: any) => {
            ServerConnection.workerConnected = true;
            this.handleWorkerMessage(data);
        });

        ServerConnection.waitWorkerConnection(this);

    }

    static async waitWorkerConnection(that: ServerConnection) {
        while (!ServerConnection.workerConnected) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        that.sendStartSimulation();
    }

    handleWorkerMessage(data: any) {
        if (data.hasOwnProperty("type")) {
            switch (data.type) {
                case "TcpOnConnect":
                    this.sendStartSimulation();
                    break;
                case "TRx":
                    // console.log(data);
                    break;
                case "Status":
                    console.log(data);
                    break;
                case "Route":
                    console.log(data);
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