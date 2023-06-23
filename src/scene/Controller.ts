import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { MainScene } from "./MainScene";

export class Controller {
    mainScene: MainScene;
    keystate: any;
    lookTarget: BABYLON.Mesh;
    camera: BABYLON.FollowCamera;

    constructor(mainScene: MainScene) {
        this.mainScene = mainScene;
        this.keystate = {};
        this.createCamera();

        window.onkeydown = (e) => {
            this.keystate[e.key] = 1;
        }
        window.onkeyup = (e) => {
            this.keystate[e.key] = 0;
        }
    }

    createLookTarget() {
        const sphere = BABYLON.MeshBuilder.CreateSphere("sphere",
            { diameter: 1, segments: 16 },
            this.mainScene.scene);
        sphere.position = new BABYLON.Vector3(50, 5, 50);
        sphere.isVisible = false;
        this.lookTarget = sphere;
    }

    createCamera() {
        this.createLookTarget();

        let campos = this.lookTarget.position.clone();
        campos.addInPlace(new BABYLON.Vector3(10, 10, 10));

        const camera = new BABYLON.FollowCamera(
            "FollowCam",
            campos,
            this.mainScene.scene);

        camera.radius = 14;
        camera.heightOffset = 8;
        camera.rotationOffset = 45;
        camera.cameraAcceleration = 0.05;
        camera.maxCameraSpeed = 10;
        camera.lockedTarget = this.lookTarget;

        this.camera = camera;
    }

    camUpdate(delta: number) {
        let lookXZDir = this.lookTarget.position.clone()
            .subtractInPlace(this.camera.position)
            .normalize();
        lookXZDir.y = 0;

        let angle = Math.atan2(lookXZDir.z, lookXZDir.x) + Math.PI / 2;
        let sideDir = new BABYLON.Vector3(Math.cos(angle), 0, Math.sin(angle));

        if (this.isKeyPressed("w") || this.isKeyPressed("W"))
            this.lookTarget.position.addInPlace(lookXZDir.scale(0.01 * delta));

        if (this.isKeyPressed("s") || this.isKeyPressed("S"))
            this.lookTarget.position.addInPlace(lookXZDir.scale(-0.01 * delta));

        if (this.isKeyPressed("a") || this.isKeyPressed("A"))
            this.lookTarget.position.addInPlace(sideDir.scale(0.01 * delta));

        if (this.isKeyPressed("d") || this.isKeyPressed("D"))
            this.lookTarget.position.addInPlace(sideDir.scale(-0.01 * delta));

        if (this.isKeyPressed("q") || this.isKeyPressed("Q"))
            this.camera.rotationOffset -= 0.1 * delta;

        if (this.isKeyPressed("e") || this.isKeyPressed("E"))
            this.camera.rotationOffset += 0.1 * delta;

        if (this.isKeyPressed("1"))
            this.camera.radius += 0.02 * delta;

        if (this.isKeyPressed("2"))
            this.camera.radius -= 0.02 * delta;

        if (this.isKeyPressed("3")){
            this.camera.fov += 0.002 * delta;
            if (this.camera.fov > 1.5)
                this.camera.fov = 1.5;
        }

        if (this.isKeyPressed("4")){
            this.camera.fov -= 0.002 * delta;
            if (this.camera.fov < 0.1)
                this.camera.fov = 0.1;
        }

        if (this.isKeyPressed("ArrowUp"))
            this.lookTarget.position.y += 0.02 * delta;

        if (this.isKeyPressed("ArrowDown"))
            this.lookTarget.position.y -= 0.02 * delta;

        if (this.isKeyPressed("PageUp"))
            this.camera.heightOffset += 0.02 * delta;

        if (this.isKeyPressed("PageDown"))
            this.camera.heightOffset -= 0.02 * delta;
    }

    update(delta: number) {
        this.camUpdate(delta);
    }

    isKeyPressed(key: string) {
        if (key in this.keystate) {
            if (this.keystate[key] == 1) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

}