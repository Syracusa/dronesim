import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import "@babylonjs/loaders/glTF";

import { MainScene } from './MainScene';
import DroneModel from '../static/drone.glb';

export interface DroneMetadata {
    selectionIndicator: BABYLON.Mesh;
    type: 'drone';
    idx: number;
    draggable: true;
    txBytes: number;
    rxBtyes: number;
    dirty: boolean;
}

export class DroneManager {
    mainScene: MainScene;
    droneMesh: BABYLON.Mesh;
    droneList: BABYLON.Mesh[] = [];
    focusedDroneList: BABYLON.Mesh[] = [];
    droneCount: number = 0;
    modelLoaded: boolean = false;

    constructor(mainScene: MainScene) {
        this.mainScene = mainScene;
        this.loadDroneModel();
    }

    cloneDrone() {
        let newDrone = this.droneMesh.clone();
        newDrone.position = new BABYLON.Vector3(0, 0, 0);
    }

    focusDrone(drone: BABYLON.Mesh) {
        drone.metadata.selectionIndicator.isVisible = true;
        this.focusedDroneList.push(drone);
    }

    unfocusAllDrones() {
        for (let i = 0; i < this.focusedDroneList.length; i++) {
            let drone = this.focusedDroneList[i];
            this.unfocusDrone(drone);
        }
        this.focusedDroneList = [];
    }

    unfocusDrone(drone: BABYLON.Mesh) {
        drone.metadata.selectionIndicator.isVisible = false;
    }

    instanciateDrone() {
        if (!this.modelLoaded) {
            console.log("Drone model not loaded yet");
            return;
        }

        let droneMesh = this.droneMesh;

        const droneSelector = BABYLON.MeshBuilder.CreateSphere("sphere",
            { diameter: 6, segments: 4 },
            this.mainScene.scene);
        droneSelector.position = new BABYLON.Vector3(0, 0, 0);

        let torus = BABYLON.MeshBuilder.CreateTorus("torus",
            { diameter: 6, thickness: 0.2, tessellation: 32 },
            this.mainScene.scene);
        const mat = new BABYLON.StandardMaterial("mat", this.mainScene.scene);
        mat.emissiveColor = new BABYLON.Color3(0, 1, 0);
        mat.disableLighting = true;
        torus.material = mat;

        torus.position = new BABYLON.Vector3(0, 0.1, 0);
        torus.setParent(droneSelector);
        torus.isVisible = false;

        const line = BABYLON.MeshBuilder.CreateLines("lines",
            {
                points:
                    [
                        new BABYLON.Vector3(0, 0, 0),
                        new BABYLON.Vector3(0, -100, 0),
                    ],
                // updatable: true
            }
        );
        line.color = new BABYLON.Color3(0, 0, 0);
        line.alpha = 0.5;
        line.setParent(droneSelector);

        droneSelector.metadata = {
            draggable: true,
            type: "drone",
            idx: this.droneCount,
            selectionIndicator: torus,
            txBytes: 0,
            rxBtyes: 0,
            dirty: true
        } as DroneMetadata;

        droneSelector.material = new BABYLON.StandardMaterial("mat", this.mainScene.scene);
        // droneSelector.material.wireframe = true;
        droneSelector.material.alpha = 0.0;

        let childMeshes = droneMesh.getChildMeshes();

        for (let meshidx = 1; meshidx < childMeshes.length; meshidx++) {
            let child = childMeshes[meshidx] as BABYLON.Mesh;
            let instancedChild = child.createInstance("dronechild");
            instancedChild.parent = droneSelector;

            instancedChild.scaling = child.absoluteScaling.clone();
            instancedChild.position = child.absolutePosition.clone();
            instancedChild.rotation = child.absoluteRotationQuaternion.toEulerAngles();

            this.mainScene.shadowGenerator.getShadowMap().renderList.push(instancedChild);
        }
        droneSelector.position = new BABYLON.Vector3(
            52 + (3 * this.droneCount) / 30,
            5,
            52 + (3 * this.droneCount) % 30);
        droneSelector.scaling = new BABYLON.Vector3(0.2, 0.2, 0.2);

        this.droneList.push(droneSelector);
        this.droneCount++;
    }

    afterLoad(newMeshes: BABYLON.AbstractMesh[]) {
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

        this.droneMesh = droneMesh;
        this.modelLoaded = true;
        for (let i = 0; i < 4; i++) {
            this.instanciateDrone();
        }
    }

    loadDroneModel() {
        const that = this;

        BABYLON.SceneLoader.ImportMesh("",
            DroneModel.replace(DroneModel.split('\\').pop().split('/').pop(), ''),
            DroneModel.split('\\').pop().split('/').pop(),
            this.mainScene.scene,
            function (newMeshes) {
                that.afterLoad(newMeshes);
            }
        );
    }
}