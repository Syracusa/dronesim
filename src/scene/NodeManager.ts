import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import "@babylonjs/loaders/glTF";

import { MainScene } from './MainScene';
import DroneModel from '../static/drone.glb';

export interface RouteEntry {
    hopCount: number;
    path: number[];
}

export interface DroneMetadata {
    selectionIndicator: BABYLON.Mesh;
    type: 'drone';
    idx: number;
    draggable: true;
    txBytes: number;
    rxBytes: number;
    dirty: boolean;
    routingTable: RouteEntry[];
    relayNodes: number[];
}

export class NodeManager {
    mainScene: MainScene;
    droneMesh: BABYLON.Mesh;
    nodeList: BABYLON.Mesh[] = [];
    focusedDroneList: BABYLON.Mesh[] = [];
    droneCount: number = 0;
    modelLoaded: boolean = false;
    pathMeshes: BABYLON.Mesh[] = [];

    constructor(mainScene: MainScene) {
        this.mainScene = mainScene;
        this.loadDroneModel();
    }

    calcRelayNode() {
        let i = 0; /* Temp */
        const oneDrone = this.nodeList[i];
        const droneMeta = oneDrone.metadata as DroneMetadata;
        for (let j = 0; j < droneMeta.routingTable.length; j++) {
            const routeEntry = droneMeta.routingTable[j];
            for (let hcnt = 0; hcnt < routeEntry.hopCount - 1; hcnt++) {
                droneMeta.relayNodes.push(routeEntry.path[hcnt]);
            }
        }
    }

    disposePathMeshes() {
        for (let i = 0; i < this.pathMeshes.length; i++) {
            this.pathMeshes[i].dispose();
        }
        this.pathMeshes = [];
    }

    drawDronePath(path: number[], adjustVec?: BABYLON.Vector3, color?: BABYLON.Color3) {
        let points = [];
        if (!adjustVec) {
            adjustVec = new BABYLON.Vector3(0, 0.2, 0);
        }

        for (let i = 0; i < path.length; i++) {
            const dronepos = this.nodeList[path[i]].position;
            if (i != 0) {
                const privDronepos = this.nodeList[path[i - 1]].position;
                const dir = dronepos.subtract(privDronepos).normalize();
                points.push(dronepos.subtract(dir.scale(1.0)).addInPlace(adjustVec));
            } else {
                points.push(dronepos.add(adjustVec));
            }
        }

        let interpolatedPoints = [];
        if (path.length > 2) {
            const catmullRom = BABYLON.Curve3.CreateCatmullRomSpline(points, 10, false);
            interpolatedPoints = catmullRom.getPoints();
        } else {
            interpolatedPoints = points;
        }

        if (color) {
            this.drawPathArrow(interpolatedPoints, color);
        } else {
            this.drawPathArrow(interpolatedPoints, BABYLON.Color3.Green());
        }
    }

    drawPathArrow(points: BABYLON.Vector3[], color: BABYLON.Color3) {
        const lastPoint = points[points.length - 1];
        const secondLastPoint = points[points.length - 2];

        const lastdir = lastPoint.subtract(secondLastPoint).normalize();
        // lastPoint.subtractInPlace(lastdir.scale(1.0));
        const arrowHeadStart = lastPoint.add(lastdir.scale(0.01));
        const arrowHeadEnd = lastPoint.add(lastdir.scale(0.5));

        points.push(arrowHeadStart);
        points.push(arrowHeadEnd);

        const tube = BABYLON.MeshBuilder.CreateTube(
            'basic-line-1',
            {
                path: points,
                // radius: 0.1,
                radiusFunction: (i, distance) => {
                    if (i == points.length - 1) {
                        return 0.0;
                    } else if (i == points.length - 2) {
                        return 0.1;
                    } else {
                        return 0.06 * (i / points.length);
                    }
                },
                instance: null,
                updatable: true,
                sideOrientation: BABYLON.Mesh.DOUBLESIDE,
                cap: BABYLON.Mesh.CAP_ALL,
                invertUV: false
            },
            this.mainScene.scene
        );

        const stdmat = new BABYLON.StandardMaterial('mat', this.mainScene.scene);

        const USE_LIGHT = 1;
        if (USE_LIGHT) {
            stdmat.diffuseColor = color;
            stdmat.emissiveColor = color;
            stdmat.specularColor = color;
        } else {
            stdmat.emissiveColor = color;
            stdmat.disableLighting = true;
            stdmat.alpha = 0.8;
        }
        tube.material = stdmat;

        this.pathMeshes.push(tube);
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

        let routingTable = [];
        for (let i = 0; i < 128; i++) {
            let entry = { hopCount: 0, path: [] } as RouteEntry;
            routingTable.push(entry);
        }

        droneSelector.metadata = {
            draggable: true,
            type: "drone",
            idx: this.droneCount,
            selectionIndicator: torus,
            txBytes: 0,
            rxBytes: 0,
            dirty: true,
            routingTable: routingTable,
            relayNodes: []
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

        if (0) {
            droneSelector.position = new BABYLON.Vector3(
                52 + (3 * this.droneCount) / 30,
                5,
                52 + (3 * this.droneCount) % 30);
        } else {
            const droneInitX =
                50 + ((4 + this.droneCount * 1.3) * Math.sin(Math.PI * this.droneCount / 5));
            const droneInitY = 5 + this.droneCount / 3;
            const droneInitZ =
                50 + ((4 + this.droneCount * 1.3) * Math.cos(Math.PI * this.droneCount / 5));
            droneSelector.position = new BABYLON.Vector3(droneInitX, droneInitY, droneInitZ);
        }
        droneSelector.scaling = new BABYLON.Vector3(0.2, 0.2, 0.2);

        this.nodeList.push(droneSelector);
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
        for (let i = 0; i < 20; i++) {
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