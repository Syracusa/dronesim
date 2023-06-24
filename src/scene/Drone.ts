import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import "@babylonjs/loaders/glTF";

import { MainScene } from './MainScene';
import DroneModel from '../static/Drone.glb';
import { BabylonFileLoaderConfiguration } from "babylonjs";

export class Drone {
    mainScene: MainScene;
    drone: BABYLON.Mesh;

    constructor(mainScene: MainScene) {
        this.mainScene = mainScene;
        this.loadDroneModel();
    }

    loadDroneModel() {
        const that = this;

        BABYLON.SceneLoader.ImportMesh("",
            "/", DroneModel.split('\\').pop().split('/').pop(),
            this.mainScene.scene,
            function (newMeshes) {
                let droneMesh = newMeshes[0] as BABYLON.Mesh;
                
                for (let i = 1; i < newMeshes.length; i++) {
                    let mesh = newMeshes[i] as any;
                    if (mesh._geometry._totalVertices > 1000) {
                        mesh.simplify([
                            {
                                quality: 0.3,
                                distance: 10
                            }
                        ], true, BABYLON.SimplificationType.QUADRATIC, function () {
                            // console.log("Simplification finished");
                        });
                    }
                }

                droneMesh.position = new BABYLON.Vector3(0, 0, 0);

                droneMesh.scaling = new BABYLON.Vector3(0.2, 0.2, 0.2);
                droneMesh.rotation.y = Math.PI / 2;
                droneMesh.rotation.x = Math.PI / 2;
                droneMesh.rotation.z = Math.PI / 2;

                const droneSelector = BABYLON.MeshBuilder.CreateSphere("sphere",
                    { diameter: 1.5, segments: 4 },
                    that.mainScene.scene);
                droneSelector.position = new BABYLON.Vector3(50, 5, 50);
                droneSelector.metadata = "drone";
                droneSelector.material = new BABYLON.StandardMaterial("mat", that.mainScene.scene);
                droneSelector.material.wireframe = true;
                // droneSelector.material.alpha = 0;

                droneMesh.parent = droneSelector;

                /* TODO : Instantiate drone
                let testmesh = newMeshes[1] as BABYLON.Mesh;
                for (let i = 2; i < newMeshes.length; i++) {
                    let mesh = newMeshes[i] as BABYLON.Mesh;
                    mesh.parent = testmesh;
                }

                for (let index = 0; index < 100; index++) {
                    let newInstance = testmesh.createInstance("i" + index);
                    newInstance.position = new BABYLON.Vector3(40 + index / 10, 6, 30 + index % 10);
                }
                */

                that.drone = droneMesh;
            });
    }
}