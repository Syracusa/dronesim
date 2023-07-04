import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import "@babylonjs/loaders/glTF";

import { MainScene } from './MainScene';
import { GuiLayer } from "./GuiLayer";
import DroneModel from '../static/drone.glb';

export interface RouteEntry {
    hopCount: number;
    path: number[];
}

export interface NodeMetadata {
    type: 'node';
    draggable: true;
    // dirty: boolean;
    node: Node;
}

export class Node {
    rootMesh: BABYLON.Mesh;
    selectionIndicator: BABYLON.Mesh;

    idx: number;
    txBytes: number;
    rxBytes: number;
    guiInfoDirty: boolean;

    routingTable: RouteEntry[];

    constructor(mainScene: MainScene, nodeMesh: BABYLON.Mesh, initPos: BABYLON.Vector3) {
        this.initRootMesh(mainScene, nodeMesh, initPos);
        this.initRoutingTable();
        this.initMeshMetadata();
        this.guiInfoDirty = true;
    }

    select() {
        this.selectionIndicator.isVisible = true;
    }

    unselect() {
        this.selectionIndicator.isVisible = false;
    }

    clonePosition() {
        return this.rootMesh.position.clone();
    }

    getPosition() {
        return this.rootMesh.position;
    }

    initRootMesh(mainScene: MainScene, nodeMesh: BABYLON.Mesh, initPos: BABYLON.Vector3) {
        const scene = mainScene.scene;

        this.rootMesh = BABYLON.MeshBuilder.CreateSphere("sphere",
            { diameter: 6, segments: 4 }, scene);
        this.rootMesh.position = new BABYLON.Vector3(0, 0, 0);

        this.rootMesh.material = new BABYLON.StandardMaterial("mat", scene);
        // this.mesh.material.wireframe = true;
        this.rootMesh.material.alpha = 0.0;

        this.rootMesh.addChild(Node.createPosHelpMesh());

        const selIndicator = Node.createSelectedIndicatorMesh(scene);
        this.rootMesh.addChild(selIndicator);
        this.selectionIndicator = selIndicator;

        let childMeshes = nodeMesh.getChildMeshes();

        for (let meshidx = 1; meshidx < childMeshes.length; meshidx++) {
            const child = childMeshes[meshidx] as BABYLON.Mesh;
            const instancedChild = child.createInstance("dronechild");
            instancedChild.parent = this.rootMesh;

            instancedChild.scaling = child.absoluteScaling.clone();
            instancedChild.position = child.absolutePosition.clone();
            instancedChild.rotation = child.absoluteRotationQuaternion.toEulerAngles();
            mainScene.shadowGenerator.getShadowMap().renderList.push(instancedChild);
        }
        this.rootMesh.position = initPos;
        this.rootMesh.scaling = new BABYLON.Vector3(0.2, 0.2, 0.2);
    }

    initMeshMetadata() {
        this.rootMesh.metadata = {
            draggable: true,
            type: 'node',
            dirty: true,
            node: this
        } as NodeMetadata;
    }

    static getNodeFromMesh(mesh: BABYLON.Mesh) {
        const metadata = mesh.metadata as NodeMetadata;
        return metadata.node;
    }

    initRoutingTable() {
        this.routingTable = [];
        for (let i = 0; i < 128; i++) {
            let entry = { hopCount: 0, path: [] } as RouteEntry;
            this.routingTable.push(entry);
        }
    }

    static createPosHelpMesh() {
        const linePoints =
            [new BABYLON.Vector3(0, 0, 0),
            new BABYLON.Vector3(0, -100, 0)];

        const posHelpLine = BABYLON.MeshBuilder.CreateLines(
            "lines",
            { points: linePoints }
        );

        posHelpLine.color = new BABYLON.Color3(0, 0, 0);
        posHelpLine.alpha = 0.5;
        return posHelpLine;
    }

    static createSelectedIndicatorMesh(scene: BABYLON.Scene) {
        const torus = BABYLON.MeshBuilder.CreateTorus("torus",
            { diameter: 6, thickness: 0.2, tessellation: 32 }, scene);

        const mat = new BABYLON.StandardMaterial("mat", scene);
        mat.emissiveColor = new BABYLON.Color3(0, 1, 0);
        mat.disableLighting = true;
        torus.material = mat;

        torus.position = new BABYLON.Vector3(0, 0.1, 0);
        torus.isVisible = false;

        return torus;
    }
}

export class NodeManager {
    mainScene: MainScene;
    droneMesh: BABYLON.Mesh;
    nodeList: Node[] = [];
    focusedNodeList: Node[] = [];
    nodeNumber: number = 0;
    modelLoaded: boolean = false;
    pathMeshes: BABYLON.Mesh[] = [];
    simplifyModel: boolean = false;

    constructor(mainScene: MainScene) {
        this.mainScene = mainScene;
        this.loadDroneModel();
    }

    disposePathMeshes() {
        for (let i = 0; i < this.pathMeshes.length; i++) {
            this.pathMeshes[i].dispose();
        }
        this.pathMeshes = [];
    }

    drawNodePaths(rootNodeIdx: number) {
        this.disposePathMeshes();
        const rootNode = this.nodeList[rootNodeIdx];
        this.getEdgeNodeIdxList(rootNodeIdx).forEach((i) => {
            this.drawNodePath([rootNodeIdx].concat(rootNode.routingTable[i].path),
                new BABYLON.Vector3(0, 0.03 * i - 0.2, 0),
                BABYLON.Color3.FromHexString(GuiLayer.beautifulColors[i])
            );
        });
    }

    drawNodePath(path: number[], adjustVec?: BABYLON.Vector3, color?: BABYLON.Color3) {
        if (path.length < 2) {
            return;
        }

        let points = [];
        if (!adjustVec) {
            adjustVec = new BABYLON.Vector3(0, 0.2, 0);
        }

        for (let i = 0; i < path.length; i++) {
            const dronepos = this.nodeList[path[i]].clonePosition();

            let dir = null as BABYLON.Vector3;

            if (i != 0) {
                const privDronepos = this.nodeList[path[i - 1]].clonePosition();
                dir = dronepos.subtract(privDronepos).normalize();
            }

            if (dir) {
                if (i == path.length - 1)
                    points.push(dronepos.subtract(dir.scale(1.0)).addInPlace(adjustVec));
                else
                    points.push(dronepos.subtract(dir.scale(0.3)).addInPlace(adjustVec));
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
        const arrowHeadStart = lastPoint.add(lastdir.scale(0.01));
        const arrowHeadEnd = lastPoint.add(lastdir.scale(0.5));

        points.push(arrowHeadStart);
        points.push(arrowHeadEnd);

        const tube = BABYLON.MeshBuilder.CreateTube(
            'RouteLine',
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

    focusNode(node: Node) {
        node.select();
        this.focusedNodeList.push(node);
    }

    unfocusAllNodes() {
        for (let i = 0; i < this.focusedNodeList.length; i++) {
            this.focusedNodeList[i].unselect();
        }
        this.focusedNodeList = [];
    }

    static simplifyMeshes(meshes: any[]) {
        for (let i = 1; i < meshes.length; i++) {
            let mesh = meshes[i] as any;
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

    afterLoad(newMeshes: BABYLON.AbstractMesh[]) {
        let droneMesh = newMeshes[0] as BABYLON.Mesh;

        if (this.simplifyModel) {
            NodeManager.simplifyMeshes(newMeshes);
        }

        droneMesh.position = new BABYLON.Vector3(0, 0, 0);
        droneMesh.scaling = new BABYLON.Vector3(0.2, 0.2, 0.2);
        droneMesh.rotation.y = Math.PI / 2;
        droneMesh.rotation.x = Math.PI / 2;
        droneMesh.rotation.z = Math.PI / 2;

        this.droneMesh = droneMesh;
        this.modelLoaded = true;
        for (let i = 0; i < 30; i++) {
            const droneInitX =
                50 + ((4 + this.nodeNumber * 1.3) * Math.sin(Math.PI * this.nodeNumber / 5));
            const droneInitY = 5 + this.nodeNumber / 3;
            const droneInitZ =
                50 + ((4 + this.nodeNumber * 1.3) * Math.cos(Math.PI * this.nodeNumber / 5));
            const initPos = new BABYLON.Vector3(droneInitX, droneInitY, droneInitZ);
            const newNode: Node = new Node(this.mainScene, droneMesh, initPos);
            newNode.idx = this.nodeNumber;

            this.nodeList.push(newNode);
            this.nodeNumber++;
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

    getEdgeNodeIdxList(rootNodeIdx: number): number[] {
        const isIdxRelay = new Array(this.nodeList.length).fill(false);
        const edgeNodeIdxList: number[] = [];
        const node = this.nodeList[rootNodeIdx];
        for (let i = 0; i < node.routingTable.length; i++) {
            const routeEntry = node.routingTable[i];
            for (let j = 0; j < routeEntry.hopCount - 1; j++) {
                const relayIdx = routeEntry.path[j];
                isIdxRelay[relayIdx] = true;
            }
        }

        for (let i = 0; i < isIdxRelay.length; i++) {
            if (!isIdxRelay[i]) {
                edgeNodeIdxList.push(i);
            }
        }

        return edgeNodeIdxList;
    }

}