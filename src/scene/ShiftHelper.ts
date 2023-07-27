import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { MainScene } from "./MainScene";
import { Controller } from "./Controller";

export class ShiftHelper {
    private arrowOrigin: BABYLON.Mesh;
    private target: BABYLON.Mesh;
    private dragStartPos: BABYLON.Vector3;
    private readonly arrowLength: number = 4;
    private isMultiTarget = false;
    private multiTargetRelPos: BABYLON.Vector3[] = [];
    private targets: BABYLON.Mesh[] = [];

    constructor(
        private readonly mainScene: MainScene,
        private readonly controller: Controller) {

        this.drawArrow();
        this.releaseTarget();
    }

    private arrowMouseDrag(arrowVec: BABYLON.Vector3) {
        const scene = this.mainScene.scene;

        const arrowStartClient = this.mainScene.worldVec3toClient(this.dragStartPos);
        arrowStartClient.z = 0;
        const arrowEndClient = this.mainScene.worldVec3toClient(this.dragStartPos.add(arrowVec));
        arrowEndClient.z = 0;

        const clientX = scene.pointerX;
        const clientY = scene.pointerY;

        const cameraProjectedArrowRay =
            new BABYLON.Ray(
                arrowStartClient,
                arrowEndClient.subtract(arrowStartClient),
                1);

        const cspoint = this.closestPointOnRay(
            cameraProjectedArrowRay,
            new BABYLON.Vector3(
                this.controller.dragStartX,
                this.controller.dragStartY,
                0));

        const ccpoint = this.closestPointOnRay(
            cameraProjectedArrowRay,
            new BABYLON.Vector3(
                clientX,
                clientY,
                0));

        const dist = BABYLON.Vector3.Distance(ccpoint, cspoint);
        const arrowDistClient = BABYLON.Vector3.Distance(arrowStartClient, arrowEndClient);

        const dot = BABYLON.Vector3.Dot(ccpoint.subtract(cspoint),
            arrowEndClient.subtract(arrowStartClient));
        const worldDist = dist / arrowDistClient;
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

        if (this.isMultiTarget) {
            for (let i = 0; i < this.targets.length; i++) {
                const oneTarget = this.targets[i];
                oneTarget.position = this.arrowOrigin.position.add(this.multiTargetRelPos[i]);
            }
        }
    }

    private createArrowMeshMeta(dir: string) {
        const arrowDirvec = new BABYLON.Vector3(0, 0, 0);
        switch (dir) {
            case "x":
                arrowDirvec.x = this.arrowLength;
                break;
            case "y":
                arrowDirvec.y = this.arrowLength;
                break;
            case "z":
                arrowDirvec.z = this.arrowLength;
                break;
            default:
                console.log("getArrowMeshMeta: invalid dir: " + dir);
                return {};
        }
        return {
            type: "ShiftArrow",
            dir: dir,
            onMouseDown: () => { this.dragStartPos = this.arrowOrigin.position.clone(); },
            onMouseDrag: () => { this.arrowMouseDrag(arrowDirvec); }
        }
    }

    private drawArrow() {
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

        const arrowX = arrow.clone("arrowX");
        arrowX.rotation.z += Math.PI / 2 * 3;
        arrowX.position.x += allowLen / 2;
        arrowX.material = matRed;
        arrowX.metadata = this.createArrowMeshMeta("x");

        const arrowY = arrow.clone("arrowY");
        arrowY.rotation.y += Math.PI / 2;
        arrowY.position.y += allowLen / 2;
        arrowY.material = matGreen;
        arrowY.metadata = this.createArrowMeshMeta("y");

        const arrowZ = arrow.clone("arrowZ");
        arrowZ.rotation.x = Math.PI / 2;
        arrowZ.position.z += allowLen / 2;
        arrowZ.material = matBlue;
        arrowZ.metadata = this.createArrowMeshMeta("z");
        arrow.isVisible = false;

        const arrowOrigin = BABYLON.MeshBuilder.CreateSphere("sphere",
            { diameter: 0.5, segments: 4 },
            this.mainScene.scene);
        arrowOrigin.position = new BABYLON.Vector3(40, 8, 40);
        arrowOrigin.metadata = "arrowOrigin";
        arrowOrigin.material = new BABYLON.StandardMaterial("mat", this.mainScene.scene);
        // arrowOrigin.material.wireframe = true;
        arrowOrigin.isVisible = false;

        arrowX.parent = arrowOrigin;
        arrowY.parent = arrowOrigin;
        arrowZ.parent = arrowOrigin;

        this.arrowOrigin = arrowOrigin;
    }

    private closestPointOnRay(ray: BABYLON.Ray, point: BABYLON.Vector3): BABYLON.Vector3 {
        const rayDir = ray.direction.normalize();
        const v = point.subtract(ray.origin);
        const d = BABYLON.Vector3.Dot(v, rayDir);
        const p = ray.origin.add(rayDir.scale(d));
        return p;
    }


    public setMultiTarget(targets: BABYLON.Mesh[]) {
        this.targets = targets;
        this.isMultiTarget = true;
        const childs = this.arrowOrigin.getChildren();
        for (let i = 0; i < childs.length; i++) {
            const onechild = childs[i] as BABYLON.Mesh;
            onechild.isVisible = true;
        }
        const targetPos = BABYLON.Vector3.Zero();
        for (let i = 0; i < targets.length; i++) {
            const oneTarget = targets[i];
            targetPos.addInPlace(oneTarget.position);
        }
        targetPos.scaleInPlace(1 / targets.length);
        this.arrowOrigin.position = targetPos;
        this.target = null;

        // calc relative pos
        this.multiTargetRelPos = [];
        for (let i = 0; i < targets.length; i++) {
            const oneTarget = targets[i];
            this.multiTargetRelPos.push(oneTarget.position.subtract(targetPos));
        }
    }

    public setTarget(target: BABYLON.Mesh) {
        this.isMultiTarget = false;
        const childs = this.arrowOrigin.getChildren();
        for (let i = 0; i < childs.length; i++) {
            const onechild = childs[i] as BABYLON.Mesh;
            onechild.isVisible = true;
        }
        this.arrowOrigin.position = target.position;
        this.target = target;
    }

    public releaseTarget() {
        const childs = this.arrowOrigin.getChildren();
        for (let i = 0; i < childs.length; i++) {
            const onechild = childs[i] as BABYLON.Mesh;
            onechild.isVisible = false;
        }
        this.target = null;
        this.isMultiTarget = false;
        this.multiTargetRelPos = [];
    }

}