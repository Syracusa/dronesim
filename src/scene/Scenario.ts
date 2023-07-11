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

    nodeCurrPos: BABYLON.Vector3[] = [];
    conf = sample1 as ScenarioConf;

    constructor(mainScene: MainScene) {

    }

    update(timeDiff: number) {

    }

    start() {
        console.log('Start scenario');
    }

    stop() {
        console.log('Stop scenario');
    }

}