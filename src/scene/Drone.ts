import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import "@babylonjs/loaders/glTF";

import { MainScene } from './MainScene';
import DroneModel from '../static/drone.glb';

export class Drone {
    mainScene: MainScene;
    drone: BABYLON.Mesh;

    constructor(mainScene: MainScene) {
        console.log(DroneModel);
        this.mainScene = mainScene;
        this.loadDroneModel();
    }

    cloneDrone() {
        let newDrone = this.drone.clone();
        newDrone.position = new BABYLON.Vector3(0, 0, 0);
    }

    loadDroneModel() {
        const that = this;

        BABYLON.SceneLoader.ImportMesh("",
            DroneModel.replace(DroneModel.split('\\').pop().split('/').pop(), ''),
            DroneModel.split('\\').pop().split('/').pop(),
            this.mainScene.scene,
            function (newMeshes) {
                let droneMesh = newMeshes[0] as BABYLON.Mesh;

                if (0) {
                    for (let i = 1; i < newMeshes.length; i++) {
                        let mesh = newMeshes[i] as any;
                        if (mesh._geometry._totalVertices > 500) {
                            mesh.simplify([
                                {
                                    quality: 0.1,
                                    distance: 1
                                }
                            ], true, BABYLON.SimplificationType.QUADRATIC, function () {
                                console.log("Simplification finished");
                            });
                        }
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
                droneSelector.material.alpha = 0;
                droneMesh.parent = droneSelector;

                that.drone = droneSelector;
                console.log(droneMesh);
                for (let i = 0; i < 3; i++) {
                    // let newDrone = that.drone.clone("drone", null, false);
                    let newDrone = that.drone.createInstance("drone");
                    newDrone.metadata = {draggable: true};

                    let childMeshes = that.drone.getChildMeshes();

                    console.log(childMeshes.length);
                    for (let meshidx = 1; meshidx < childMeshes.length; meshidx++) {
                        let child = childMeshes[meshidx] as BABYLON.Mesh;
                        let instancedChild = child.createInstance("drone" + meshidx);
                        instancedChild.parent = newDrone;

                        instancedChild.scaling = child.absoluteScaling.clone();
                        instancedChild.position = child.absolutePosition.clone();
                        instancedChild.rotation = child.absoluteRotationQuaternion.toEulerAngles();
                    }

                    newDrone.scaling = new BABYLON.Vector3(0.2, 0.2, 0.2);
                    newDrone.position =
                        new BABYLON.Vector3(52 + (3 * i) / 30, 5, 52 + (3 * i) % 30);
                }

            });
    }
}