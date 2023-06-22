import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import "@babylonjs/loaders/glTF";

import { MainScene } from './MainScene';
import DroneModel from '../static/Drone.glb';

export class Drone {
    mainScene: MainScene;

    constructor(mainScene: MainScene) {
        this.mainScene = mainScene;
        this.loadDroneModel();
    }

    loadDroneModel() {
        // Drone model
        console.log(DroneModel);
        BABYLON.SceneLoader.ImportMesh("",
        "/", DroneModel.split('\\').pop().split('/').pop(),
            this.mainScene.scene,
            function (newMeshes) {
                const drone = newMeshes[0];
                drone.position.x = 50;
                drone.position.z = 50;
                drone.position.y = 5;
                drone.scaling = new BABYLON.Vector3(0.2, 0.2, 0.2);
                drone.rotation.y = Math.PI / 2;
                drone.rotation.x = Math.PI / 2;
                drone.rotation.z = Math.PI / 2;
            });
    }
}