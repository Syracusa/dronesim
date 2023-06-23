import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { MainScene } from "./MainScene";

export class ShiftHelper {
    mainScene: MainScene;
    arrow: BABYLON.Mesh;

    constructor(mainScene: MainScene) {
        this.mainScene = mainScene;
        this.drawArrow();
    }

    drawArrow() {
        const allowLen = 4;
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

        const arrow = BABYLON.Mesh.MergeMeshes([arrowTip, arrowBody], true, true, undefined, false, true);

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
        arrow.position = new BABYLON.Vector3(40, 10, 40);

        let arrowX = arrow.clone("arrowX");
        arrowX.rotation.z += Math.PI / 2 * 3;
        arrowX.position.x += allowLen / 2;
        arrowX.material = matRed;

        let arrowY = arrow.clone("arrowY");
        arrowY.rotation.y += Math.PI / 2;
        arrowY.position.y += allowLen / 2;
        arrowY.material = matGreen;

        let arrowZ = arrow.clone("arrowZ");
        arrowZ.rotation.x = Math.PI / 2;
        arrowZ.position.z += allowLen / 2;
        arrowZ.material = matBlue;

        arrow.isVisible = false;
        this.arrow = arrow;
    }

}