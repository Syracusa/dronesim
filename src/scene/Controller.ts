import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { MainScene } from "./MainScene";
import { ShiftHelper } from "./ShiftHelper";
import { GuiLayer } from "./GuiLayer";
import { NodeManager, Node } from "./NodeManager";
import { ServerConnection } from "./ServerConnection";

export class Controller {
    mainScene: MainScene;
    keystate: any;
    lookTarget: BABYLON.Mesh;
    camera: BABYLON.FollowCamera;
    scene: BABYLON.Scene;
    shiftHelper: ShiftHelper;
    dragStartX: number;
    dragStartY: number;
    selTarget: BABYLON.Mesh;
    isDragging: boolean = false;
    guiLayer: GuiLayer;
    nodeManager: NodeManager;
    serverConnection: ServerConnection;
    dragHandlerExist: boolean = false;

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

        this.nodeManager = new NodeManager(mainScene);

        this.guiLayer = new GuiLayer(mainScene, this.nodeManager);

        this.serverConnection = new ServerConnection(this.nodeManager);
    }

    handleMouseDown() {
        this.isDragging = true;
        this.dragStartX = this.scene.pointerX;
        this.dragStartY = this.scene.pointerY;

        const scene = this.scene;
        const ray = scene.createPickingRay(scene.pointerX, scene.pointerY,
            BABYLON.Matrix.Identity(), this.camera, false);
        const hit = scene.pickWithRay(ray);

        const mesh = hit.pickedMesh as BABYLON.Mesh;
        if (mesh) {
            let meta = mesh.metadata;
            if (meta) {
                this.selTarget = mesh as BABYLON.Mesh;
                if (meta.onMouseDown)
                    meta.onMouseDown();
                if (meta.draggable) {
                    this.shiftHelper.setTarget(mesh as BABYLON.Mesh);
                }

                if (meta.type) {
                    if (meta.type == 'terrain') {
                        this.shiftHelper.releaseTarget();
                        this.nodeManager.unfocusAllNodes();
                    } else if (meta.type == 'node') {
                        this.nodeManager.unfocusAllNodes();
                        const node: Node = Node.getNodeFromMesh(mesh);
                        this.nodeManager.focusNode(node);
                    }
                }
            } else {
                console.log('No metadata');
            }
        } else {
            console.log('No mesh');
        }
    }

    getDraggedNodes(): Node[] {
        let draggedNodes: Node[] = [];
        let nodeList = this.nodeManager.nodeList;
        for (let i = 0; i < nodeList.length; i++) {
            let clientPos = this.mainScene.worldVec3toClient(
                nodeList[i].clonePosition());

            let x1, x2, y1, y2;
            if (this.dragStartX < this.scene.pointerX) {
                x1 = this.dragStartX;
                x2 = this.scene.pointerX;
            } else {
                x1 = this.scene.pointerX;
                x2 = this.dragStartX;
            }
            if (this.dragStartY < this.scene.pointerY) {
                y1 = this.dragStartY;
                y2 = this.scene.pointerY;
            } else {
                y1 = this.scene.pointerY;
                y2 = this.dragStartY;
            }

            if (clientPos.x > x1 && clientPos.x < x2 &&
                clientPos.y > y1 && clientPos.y < y2) {
                draggedNodes.push(nodeList[i]);
            }
        }
        return draggedNodes;
    }

    handleMouseUp() {
        this.isDragging = false;

        if (!this.dragHandlerExist) {
            let draggedNodes = this.getDraggedNodes();
            if (draggedNodes.length > 0) {
                this.shiftHelper.setMultiTarget(draggedNodes.map((n)=>{
                    return n.rootMesh;
                }));
                this.nodeManager.unfocusAllNodes();
                for (let i = 0; i < draggedNodes.length; i++)
                    this.nodeManager.focusNode(draggedNodes[i]);
            }
        }
        this.guiLayer.updateDragIndicator(0, 0, 0, 0);
    }

    handleMouseMove() {
        this.dragHandlerExist = false;
        if (this.selTarget) {
            if (this.selTarget.metadata) {
                if (this.selTarget.metadata.onMouseDrag && this.isDragging) {
                    this.selTarget.metadata.onMouseDrag();
                    this.dragHandlerExist = true;
                }
            }
        }

        if (!this.dragHandlerExist && this.isDragging) {
            this.guiLayer.updateDragIndicator(
                this.dragStartX, this.dragStartY,
                this.scene.pointerX, this.scene.pointerY);
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
        this.mainScene.dirty = true;
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
        sphere.position = new BABYLON.Vector3(90, 10, 90);
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

        // camera.attachControl(true);
        // camera.inputs.clear();
        this.camera = camera;
    }

    camUpdate(delta: number) {
        let lookXZDir = this.lookTarget.position.clone()
            .subtractInPlace(this.camera.position);
        lookXZDir.y = 0;
        lookXZDir.normalize();

        let angle = Math.atan2(lookXZDir.z, lookXZDir.x) + Math.PI / 2;
        let sideDir = new BABYLON.Vector3(Math.cos(angle), 0, Math.sin(angle));

        if (this.isKeyPressed("w") || this.isKeyPressed("W"))
            this.lookTarget.position.addInPlace(lookXZDir.scale(0.1 * delta));

        if (this.isKeyPressed("s") || this.isKeyPressed("S"))
            this.lookTarget.position.addInPlace(lookXZDir.scale(-0.1 * delta));

        if (this.isKeyPressed("a") || this.isKeyPressed("A"))
            this.lookTarget.position.addInPlace(sideDir.scale(0.1 * delta));

        if (this.isKeyPressed("d") || this.isKeyPressed("D"))
            this.lookTarget.position.addInPlace(sideDir.scale(-0.1 * delta));

        if (this.isKeyPressed("q") || this.isKeyPressed("Q"))
            this.camera.rotationOffset -= 0.1 * delta;

        if (this.isKeyPressed("e") || this.isKeyPressed("E"))
            this.camera.rotationOffset += 0.1 * delta;

        if (this.isKeyPressed("1")) {
            if (this.camera.radius > 0.02 * delta)
                this.camera.radius -= 0.02 * delta;
        }

        if (this.isKeyPressed("2"))
            this.camera.radius += 0.02 * delta;

        if (this.isKeyPressed("3")) {
            this.camera.fov -= 0.002 * delta;
            if (this.camera.fov < 0.1)
                this.camera.fov = 0.1;
        }

        if (this.isKeyPressed("4")) {
            this.camera.fov += 0.002 * delta;
            if (this.camera.fov > 3)
                this.camera.fov = 3;
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
        this.guiLayer.update();
        this.camUpdate(delta);
    }

    isKeyPressed(key: string) {
        if (key in this.keystate) {
            if (this.keystate[key] == 1) {
                this.mainScene.dirty = true;
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

}