import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import sample1 from "../static/scenario/sample1.json"
import { NodeManager } from "./NodeManager";
import { MainScene } from "./MainScene";
import { ServerConnection } from "./ServerConnection";

interface KeyFrame {
    time: number;
    nodePostions?: {};
}

export interface ScenarioConf {
    nodeNum: number;
    keyFrames: KeyFrame[];
    options?: any;
}


export class Scenario {
    mainScene: MainScene;
    nodeManager: NodeManager;
    serverConnection: ServerConnection;

    nodeCurrPos: BABYLON.Vector3[] = [];
    conf = sample1 as ScenarioConf;
    initdone = false;

    constructor(mainScene: MainScene, nodeManager: NodeManager, serverConnection: ServerConnection) {
        this.mainScene = mainScene;
        this.nodeManager = nodeManager;
        this.serverConnection = serverConnection;

        this.initAsync();
    }

    async initAsync() {
        await this.nodeManager.createNodes(this.conf.nodeNum);
        this.initdone = true;
    }

    update(timeDiff: number) {

    }

    start() {
        if (!this.initdone) {
            console.error('Scenario not initialized');
            return;
        }
        console.log('Start scenario');
        this.serverConnection.sendStartSimulation();
    }
}