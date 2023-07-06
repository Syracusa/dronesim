import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import "@babylonjs/loaders/glTF";

import { MainScene } from './MainScene';
import DroneModel from '../static/drone.glb';

export interface RouteEntry {
    hopCount: number;
    path: number[];
}

export interface NodeMetadata {
    type: 'node';
    draggable: true;
    node: Node;
}

const HEX_COLORS = [
    "#FF0000", "#FFC0CB", "#3A3B3C", "#4B0150", "#151B54", "#1E90FF", "#EB5406", "#52595D",
    "#F8F0E3", "#7FFFD4", "#728FCE", "#357EC7", "#00BFFF", "#808000", "#FFDB58", "#16F529",
    "#43C6DB", "#E67451", "#000000", "#ADD8E6", "#800080", "#8B8000", "#ECC5C0", "#008000",
    "#0C090A", "#AA6C39", "#00008B", "#36013F", "#454545", "#00FF00", "#2B65EC", "#0000FF",
    "#87CEEB", "#FDD017", "#6F4E37", "#34A56F", "#5EFB6E", "#686A6C", "#00FFFF", "#D4AF37",
    "#006400", "#A52A2A", "#800000", "#C0C0C0", "#8B0000", "#FFDF00", "#666362", "#FEFCFF",
    "#FFD700", "#FFFF00", "#D3D3D3", "#BCC6CC", "#98AFC7", "#1589FF", "#F62817", "#F70D1A",
    "#F8F6F0", "#4863A0", "#FFCE44", "#966F33", "#7E3517", "#123456", "#000080", "#008080",
    "#FAAFBA", "#625D5D", "#E5E4E2", "#F5F5DC", "#F6BE00", "#E75480", "#0041C2", "#FFFDD0",
    "#808080", "#A9A9A9", "#9D00FF", "#FF6700", "#368BC1", "#FFFFFF", "#29465B", "#C2DFFF",
    "#B87333", "#CD7F32", "#E41B17", "#95B9C7", "#FFA500", "#93917C", "#E1D9D1", "#90EE90",
    "#FFE87C", "#1569C7", "#F535AA", "#DADBDD", "#FFCCCB", "#FF00FF",
];

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

        const VIEW_ROOTMESH = 0;
        if (VIEW_ROOTMESH)
            this.rootMesh.material.wireframe = true;
        else
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

    initRoutingTable() {
        this.routingTable = [];
        for (let i = 0; i < 128; i++) {
            let entry = { hopCount: 0, path: [] } as RouteEntry;
            this.routingTable.push(entry);
        }
    }

    static getNodeFromMesh(mesh: BABYLON.Mesh) {
        const metadata = mesh.metadata as NodeMetadata;
        return metadata.node;
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
                BABYLON.Color3.FromHexString(HEX_COLORS[i])
            );
        });
    }

    drawNodePath(path: number[], adjustVec?: BABYLON.Vector3, color?: BABYLON.Color3) {
        if (path.length < 2)
            return;

        const points = [];
        if (!adjustVec)
            adjustVec = new BABYLON.Vector3(0, 0.2, 0);

        for (let i = 0; i < path.length; i++) {
            const dronepos = this.nodeList[path[i]].clonePosition();
            let dir: BABYLON.Vector3 = null;

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

        let interpolatedPoints: BABYLON.Vector3[];
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
                radiusFunction: (i, distance) => {
                    switch (i) {
                        case 0:
                        case points.length - 1:
                            return 0.0;
                        case points.length - 2:
                            return 0.1;
                        default:
                            return 0.06 * ((i + 1) / points.length);
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
        for (let i = 0; i < this.focusedNodeList.length; i++)
            this.focusedNodeList[i].unselect();
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

        if (this.simplifyModel)
            NodeManager.simplifyMeshes(newMeshes);

        droneMesh.position = new BABYLON.Vector3(0, 0, 0);
        droneMesh.scaling = new BABYLON.Vector3(0.2, 0.2, 0.2);
        droneMesh.rotation.y = Math.PI / 2;
        droneMesh.rotation.x = Math.PI / 2;
        droneMesh.rotation.z = Math.PI / 2;

        this.droneMesh = droneMesh;
        this.modelLoaded = true;
        for (let i = 0; i < 30; i++) {
            const droneInitX =
                100 + ((4 + this.nodeNumber * 1.3) * Math.sin(Math.PI * this.nodeNumber / 5));
            const droneInitY = 5 + this.nodeNumber / 3;
            const droneInitZ =
                100 + ((4 + this.nodeNumber * 1.3) * Math.cos(Math.PI * this.nodeNumber / 5));
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
            if (!isIdxRelay[i])
                edgeNodeIdxList.push(i);
        }

        return edgeNodeIdxList;
    }
}