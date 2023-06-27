import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { MainScene } from "./MainScene";
import { ShiftHelper } from "./ShiftHelper";

export class Controller {
    mainScene: MainScene;
    keystate: any;
    lookTarget: BABYLON.Mesh;
    camera: BABYLON.FollowCamera;
    scene: BABYLON.Scene;
    shiftHelper: ShiftHelper;
    dragStartX: number;
    dragStartY: number;
    dragTarget: BABYLON.Mesh;

    constructor(mainScene: MainScene) {
        this.mainScene = mainScene;
        this.scene = this.mainScene.scene;
        this.keystate = {};
        this.createCamera();

        window.onkeydown = (e) => {
            this.keystate[e.key] = 1;
        }
        window.onkeyup = (e) => {
            this.keystate[e.key] = 0;
        }

        this.setMouseHandler();
        this.shiftHelper = new ShiftHelper(mainScene, this);
    }

    handleMouseDown() {
        this.dragStartX = this.scene.pointerX;
        this.dragStartY = this.scene.pointerY;

        const scene = this.scene;
        const ray = scene.createPickingRay(scene.pointerX, scene.pointerY,
            BABYLON.Matrix.Identity(), this.camera, false);
        const hit = scene.pickWithRay(ray);

        const mesh = hit.pickedMesh;
        if (mesh) {
            let meta = mesh.metadata;
            if (meta) {
                if (meta.onMouseDown)
                    meta.onMouseDown();
                if (meta.draggable) {
                    this.shiftHelper.setTarget(mesh as BABYLON.Mesh);
                    this.dragTarget = mesh as BABYLON.Mesh;
                } else {
                    console.log('Not draggable');
                }
                if (meta.type){
                    console.log(meta.type);
                }
            } else {
                console.log('No metadata');
            }
        } else {
            console.log('No mesh');
        }
    }

    handleMouseUp() {
        this.dragTarget = null;
    }

    handleMouseMove() {
        if (this.dragTarget) {
            if (this.dragTarget.metadata) {
                if (this.dragTarget.metadata.onMouseDrag)
                    this.dragTarget.metadata.onMouseDrag();
            }
        }
    }

    setMouseHandlerInContext(pointerInfo: BABYLON.PointerInfo) {
        switch (pointerInfo.type) {
            case BABYLON.PointerEventTypes.POINTERDOWN:
                this.handleMouseDown();
                break;
            case BABYLON.PointerEventTypes.POINTERUP:
                this.handleMouseUp();
                break;
            case BABYLON.PointerEventTypes.POINTERMOVE:
                this.handleMouseMove();
                break;
            case BABYLON.PointerEventTypes.POINTERWHEEL:

                break;
            case BABYLON.PointerEventTypes.POINTERPICK:

                break;
            case BABYLON.PointerEventTypes.POINTERTAP:

                break;
            case BABYLON.PointerEventTypes.POINTERDOUBLETAP:

                break;
        }
    }

    setMouseHandler() {
        const that = this;
        this.mainScene.scene.onPointerObservable.add((pointerInfo) => {
            that.setMouseHandlerInContext(pointerInfo);
        });
    }

    createLookTarget() {
        const sphere = BABYLON.MeshBuilder.CreateSphere("sphere",
            { diameter: 1, segments: 16 },
            this.mainScene.scene);
        sphere.position = new BABYLON.Vector3(40, 10, 40);
        sphere.isVisible = false;
        this.lookTarget = sphere;
    }

    createCamera() {
        this.createLookTarget();

        let campos = this.lookTarget.position.clone();
        campos.addInPlace(new BABYLON.Vector3(3, 3, 3));

        const camera = new BABYLON.FollowCamera(
            "FollowCam",
            campos,
            this.mainScene.scene);

        camera.radius = 11;
        camera.heightOffset = 8;
        camera.rotationOffset = 225;
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

        if (this.isKeyPressed("3")) {
            this.camera.fov -= 0.002 * delta;
            if (this.camera.fov < 0.1)
                this.camera.fov = 0.1;
        }

        if (this.isKeyPressed("4")) {
            this.camera.fov += 0.002 * delta;
            if (this.camera.fov > 1.5)
                this.camera.fov = 1.5;
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