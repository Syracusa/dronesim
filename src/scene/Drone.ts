import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import "@babylonjs/loaders/glTF";

import { MainScene } from './MainScene';
import DroneModel from '../static/Drone.glb';

export class Drone {
    mainScene: MainScene;
    drone: BABYLON.Mesh;

    constructor(mainScene: MainScene) {
        this.mainScene = mainScene;
        this.loadDroneModel();
    }

    loadDroneModel() {
        const that = this;
        console.log(DroneModel);

        BABYLON.SceneLoader.ImportMesh("",
            "/", DroneModel.split('\\').pop().split('/').pop(),
            this.mainScene.scene,
            function (newMeshes) {
                let drone = newMeshes[0] as BABYLON.Mesh;
                console.log(newMeshes.length);

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

                drone.position = new BABYLON.Vector3(0, 0, 0);

                drone.scaling = new BABYLON.Vector3(0.2, 0.2, 0.2);
                drone.rotation.y = Math.PI / 2;
                drone.rotation.x = Math.PI / 2;
                drone.rotation.z = Math.PI / 2;


                const sphere = BABYLON.MeshBuilder.CreateSphere("sphere",
                    { diameter: 1.5, segments: 4 },
                    that.mainScene.scene);
                sphere.position = new BABYLON.Vector3(50, 5, 50);
                sphere.metadata = "drone";
                sphere.material = new BABYLON.StandardMaterial("mat", that.mainScene.scene);
                sphere.material.wireframe = true;

                drone.parent = sphere;

                that.drone = drone;
            });
    }
}