import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { MainScene } from "./MainScene";
import { Controller } from "./Controller";

export class ShiftHelper {
    mainScene: MainScene;
    controller: Controller;
    arrowOrigin: BABYLON.Mesh;
    target: BABYLON.Mesh;
    dragStartPos: BABYLON.Vector3;
    arrowLength: number = 4;

    constructor(mainScene: MainScene,
        controller: Controller) {
        this.mainScene = mainScene;
        this.controller = controller;
        this.drawArrow();
    }

    setTarget(target: BABYLON.Mesh) {
        this.arrowOrigin.isVisible = true;
        this.arrowOrigin.position = target.position;
        this.target = target;
    }

    releaseTarget() {
        this.arrowOrigin.isVisible = false;
        this.target = null;
    }

    arrowMouseDown() {
        this.dragStartPos = this.arrowOrigin.position.clone();
    }

    arrowMouseDrag(arrowVec: BABYLON.Vector3) {
        const scene = this.mainScene.scene;

        const arrowStartClient = this.worldVec3toClient(this.dragStartPos);
        arrowStartClient.z = 0;
        // console.log(arrowStartClient);
        const arrowEndClient = this.worldVec3toClient(this.dragStartPos.add(arrowVec));
        arrowEndClient.z = 0;

        const clientX = scene.pointerX;
        const clientY = scene.pointerY;

        const cameraProjectedArrowRay =
            new BABYLON.Ray(
                arrowStartClient,
                arrowEndClient.subtract(arrowStartClient),
                1);

        let cspoint = this.closestPointOnRay(
            cameraProjectedArrowRay,
            new BABYLON.Vector3(
                this.controller.dragStartX,
                this.controller.dragStartY,
                0));

        let ccpoint = this.closestPointOnRay(
            cameraProjectedArrowRay,
            new BABYLON.Vector3(
                clientX,
                clientY,
                0));

        const dist = BABYLON.Vector3.Distance(ccpoint, cspoint);
        const arrowDistClient = BABYLON.Vector3.Distance(arrowStartClient, arrowEndClient);
        // console.log(dist / arrowDistClient);

        const dot = BABYLON.Vector3.Dot(ccpoint.subtract(cspoint),
            arrowEndClient.subtract(arrowStartClient));
        let worldDist = dist / arrowDistClient * this.arrowLength;
        if (dot > 0) {
            this.arrowOrigin.position =
                this.dragStartPos.add(arrowVec.normalize().scale(worldDist));
        } else {
            this.arrowOrigin.position =
                this.dragStartPos.subtract(arrowVec.normalize().scale(worldDist));
        }

        if (this.target) {
            this.target.position = this.arrowOrigin.position;
        }

    }

    drawArrow() {
        const allowLen = this.arrowLength;
        const scene = this.mainScene.scene;

        const arrowTip = BABYLON.MeshBuilder.CreateCylinder("arrow",
            { height: 1, diameterTop: 0.0, diameterBottom: 0.5 });
        arrowTip.position = new BABYLON.Vector3(0, allowLen / 2, 0);
        arrowTip.rotation = new BABYLON.Vector3(0, 0, 0);
        arrowTip.scaling = new BABYLON.Vector3(1, 1, 1);

        const arrowBody = BABYLON.MeshBuilder.CreateCylinder("arrow",
            { height: allowLen, diameterTop: 0.2, diameterBottom: 0.2 });
        arrowBody.position = new BABYLON.Vector3(0, 0, 0);
        arrowBody.rotation = new BABYLON.Vector3(0, 0, 0);
        arrowBody.scaling = new BABYLON.Vector3(1, 1, 1);

        const arrow = BABYLON.Mesh.MergeMeshes(
            [arrowTip, arrowBody], true, true, undefined, false, true);

        const matGreen = new BABYLON.StandardMaterial("arrowMat", scene);
        matGreen.diffuseColor = new BABYLON.Color3(0.0, 1.0, 0.0);
        matGreen.specularColor = new BABYLON.Color3(0.0, 0.0, 0.0);
        matGreen.emissiveColor = new BABYLON.Color3(0.0, 0.7, 0.0);
        matGreen.backFaceCulling = false;

        const matRed = new BABYLON.StandardMaterial("arrowMat", scene);
        matRed.diffuseColor = new BABYLON.Color3(1.0, 0.0, 0.0);
        matRed.specularColor = new BABYLON.Color3(0.0, 0.0, 0.0);
        matRed.emissiveColor = new BABYLON.Color3(0.7, 0.0, 0.0);
        matRed.backFaceCulling = false;

        const matBlue = new BABYLON.StandardMaterial("arrowMat", scene);
        matBlue.diffuseColor = new BABYLON.Color3(0.0, 0.0, 1.0);
        matBlue.specularColor = new BABYLON.Color3(0.0, 0.0, 0.0);
        matBlue.emissiveColor = new BABYLON.Color3(0.0, 0.0, 0.7);
        matBlue.backFaceCulling = false;

        arrow.metadata = "arrow";
        arrow.position = BABYLON.Vector3.Zero();
        const that = this;

        let arrowX = arrow.clone("arrowX");
        arrowX.rotation.z += Math.PI / 2 * 3;
        arrowX.position.x += allowLen / 2;
        arrowX.material = matRed;
        arrowX.metadata = {
            type: "ShiftArrow",
            dir: "x",
            onMouseDown: () => {
                that.arrowMouseDown();
            },
            onMouseDrag: () => {
                that.arrowMouseDrag(new BABYLON.Vector3(that.arrowLength, 0, 0));
            }
        };

        let arrowY = arrow.clone("arrowY");
        arrowY.rotation.y += Math.PI / 2;
        arrowY.position.y += allowLen / 2;
        arrowY.material = matGreen;
        arrowY.metadata = {
            type: "ShiftArrow",
            dir: "y",
            onMouseDown: () => {
                that.arrowMouseDown();
            },
            onMouseDrag: () => {
                that.arrowMouseDrag(new BABYLON.Vector3(0, that.arrowLength, 0));
            }
        };

        let arrowZ = arrow.clone("arrowZ");
        arrowZ.rotation.x = Math.PI / 2;
        arrowZ.position.z += allowLen / 2;
        arrowZ.material = matBlue;
        arrowZ.metadata = {
            type: "ShiftArrow",
            dir: "z",
            onMouseDown: () => {
                that.arrowMouseDown();
            },
            onMouseDrag: () => {
                that.arrowMouseDrag(new BABYLON.Vector3(0, 0, that.arrowLength));
            }
        };
        arrow.isVisible = false;

        const arrowOrigin = BABYLON.MeshBuilder.CreateSphere("sphere",
            { diameter: 0.5, segments: 4 },
            this.mainScene.scene);
        arrowOrigin.position = new BABYLON.Vector3(40, 8, 40);
        arrowOrigin.metadata = "arrowOrigin";
        arrowOrigin.material = new BABYLON.StandardMaterial("mat", this.mainScene.scene);
        arrowOrigin.material.wireframe = true;

        arrowX.parent = arrowOrigin;
        arrowY.parent = arrowOrigin;
        arrowZ.parent = arrowOrigin;

        this.arrowOrigin = arrowOrigin;
    }

    closestPointOnRay(ray: BABYLON.Ray, point: BABYLON.Vector3): BABYLON.Vector3 {
        const rayDir = ray.direction.normalize();
        const v = point.subtract(ray.origin);
        // console.log("v" + v);
        const d = BABYLON.Vector3.Dot(v, rayDir);
        // console.log("d" + d);
        // console.log("RayDir" + rayDir.scale(d));
        const p = ray.origin.add(rayDir.scale(d));
        return p;
    }

    /* Calculate cloest point on line to a point */
    closestPointOnLine(
        lineP1: BABYLON.Vector3,
        lineP2: BABYLON.Vector3,
        point: BABYLON.Vector3)
        : BABYLON.Vector3 {
        const lineDir = lineP2.subtract(lineP1).normalize();
        const v = point.subtract(lineP1);
        const d = BABYLON.Vector3.Dot(v, lineDir);
        const p = lineP1.add(lineDir.scale(d));
        return p;
    }

    clientXYtoWorldXY(clientX: number, clientY: number): BABYLON.Vector3 {
        const scene = this.mainScene.scene;
        const pickResult = scene.pick(scene.pointerX, scene.pointerY);
        if (pickResult.hit) {
            return pickResult.pickedPoint;
        }
        return null;
    }

    /* Vec3 to Client */
    worldVec3toClient(vec3: BABYLON.Vector3): BABYLON.Vector3 {
        const scene = this.mainScene.scene;
        const camera = scene.activeCamera;
        const transform = BABYLON.Vector3.Project(
            vec3,
            BABYLON.Matrix.Identity(),
            scene.getTransformMatrix(),
            camera.viewport.toGlobal(
                scene.getEngine().getRenderWidth(true),
                scene.getEngine().getRenderHeight(true)));
        return transform;
    }
}