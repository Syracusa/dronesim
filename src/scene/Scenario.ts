import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import sample1 from "../static/scenario/sample1.json"
import { NodeManager } from "./NodeManager";
import { MainScene } from "./MainScene";
import { ServerConnection } from "./ServerConnection";

interface KeyFrame {
    time: number;
    nodePostions?: object;
}

export interface ScenarioConf {
    nodeNum: number;
    keyFrames: KeyFrame[];
    options?: object;
}

export class Scenario {
    nodeCurrPos: BABYLON.Vector3[] = [];
    nodeLastPosInKeyFrame: BABYLON.Vector3[] = [];

    conf = sample1 as ScenarioConf;
    initdone = false;

    scenarioTime = 0;
    play = false;
    lastKeyFrameIndex = 0;


    constructor(
        private readonly mainScene: MainScene,
        private readonly nodeManager: NodeManager,
        private readonly serverConnection: ServerConnection) {

        this.initAsync();
    }

    async initAsync() {
        await this.nodeManager.createNodes(this.conf.nodeNum);
        this.initdone = true;
    }

    update(timeDiff: number) {
        if (!this.play) {
            return;
        }

        this.scenarioTime += timeDiff;
        const keyFrames = this.conf.keyFrames;
        const keyFrameCount = keyFrames.length;
        let keyFrameIndex = 0;
        for (; keyFrameIndex < keyFrameCount; keyFrameIndex++) {
            if (keyFrames[keyFrameIndex].time > this.scenarioTime) {
                break;
            }
        }
        if (keyFrameIndex >= keyFrameCount) {
            this.play = false;
            return;
        }
        if (keyFrameIndex != this.lastKeyFrameIndex) {
            this.lastKeyFrameIndex = keyFrameIndex;
            this.nodeLastPosInKeyFrame = this.nodeCurrPos;
        }
        // const keyFrame = keyFrames[keyFrameIndex];
        // const nextKeyFrame = keyFrames[keyFrameIndex + 1];
        // const ratio = (this.scenarioTime - keyFrame.time) / (nextKeyFrame.time - keyFrame.time);
        // const nodePostions = keyFrame.nodePostions;
        // const nextNodePostions = nextKeyFrame.nodePostions;
        for (let i = 0; i < this.conf.nodeNum; i++) {
            // const node = this.nodeManager.nodeList[i];
            // const nodePos = nodePostions[i];
            // const nextNodePos = nextNodePostions[i];
            // if (nodePos && nextNodePos) {
            //     const pos = BABYLON.Vector3.Lerp(nodePos, nextNodePos, ratio);
            //     node.setPosition(pos);
            // }
        }
    }

    start() {
        if (!this.initdone) {
            console.error('Scenario not initialized');
            return;
        }
        console.log('Start scenario');
        this.serverConnection.sendStartSimulation();
        this.scenarioTime = 0;
        this.lastKeyFrameIndex = 0;
        this.play = true;
    }

    pause() {
        console.log('Pause scenario');
    }

    resume() {
        console.log('Resume scenario');
    }
}