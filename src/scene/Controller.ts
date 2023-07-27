import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { MainScene } from "./MainScene";
import { ShiftHelper } from "./ShiftHelper";
import { GuiLayer } from "./GuiLayer";
import { NodeManager, Node } from "./NodeManager";
import { ServerConnection } from "./ServerConnection";
import { Scenario } from "./Scenario";

export class Controller {
    private readonly shiftHelper = new ShiftHelper(this.mainScene, this);
    private readonly nodeManager = new NodeManager(this.mainScene);
    private readonly serverConnection = new ServerConnection(this.nodeManager);
    private readonly scenario = new Scenario(this.mainScene, this.nodeManager, this.serverConnection);
    private readonly guiLayer = new GuiLayer(this.mainScene, this.nodeManager, this.scenario);

    private keystate: { [key: string]: number } = {};
    private lookTarget: BABYLON.Mesh;
    private camera: BABYLON.FollowCamera;
    private selTarget: BABYLON.Mesh;
    private isDragging = false;
    private dragHandlerExist = false;
    
    public dragStartX: number;
    public dragStartY: number;
    
    constructor(private readonly mainScene: MainScene) {
        this.createCamera();
        this.setMouseHandler();
        window.onkeydown = (e) => { this.keystate[e.key] = 1; };
        window.onkeyup = (e) => { this.keystate[e.key] = 0; };
    }

    private handleMouseDown() {
        const scene = this.mainScene.scene;

        this.isDragging = true;
        this.dragStartX = scene.pointerX;
        this.dragStartY = scene.pointerY;

        const ray = scene.createPickingRay(scene.pointerX, scene.pointerY,
            BABYLON.Matrix.Identity(), this.camera, false);
        const hit = scene.pickWithRay(ray);

        const mesh = hit.pickedMesh as BABYLON.Mesh;
        if (mesh) {
            const meta = mesh.metadata;
            if (meta) {
                this.selTarget = mesh as BABYLON.Mesh;
                if (meta.onMouseDown)
                    meta.onMouseDown();
                if (meta.draggable) 
                    this.shiftHelper.setTarget(mesh as BABYLON.Mesh);

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
                this.shiftHelper.releaseTarget();
                this.nodeManager.unfocusAllNodes();
            }
        } else {
            console.log('No mesh');
        }
    }

    private getDraggedNodes(): Node[] {
        const scene = this.mainScene.scene;
        const draggedNodes: Node[] = [];
        const nodeList = this.nodeManager.nodeList;
        for (let i = 0; i < nodeList.length; i++) {
            const clientPos = this.mainScene.worldVec3toClient(
                nodeList[i].clonePosition());

            let x1, x2, y1, y2;
            if (this.dragStartX < scene.pointerX) {
                x1 = this.dragStartX;
                x2 = scene.pointerX;
            } else {
                x1 = scene.pointerX;
                x2 = this.dragStartX;
            }
            if (this.dragStartY < scene.pointerY) {
                y1 = this.dragStartY;
                y2 = scene.pointerY;
            } else {
                y1 = scene.pointerY;
                y2 = this.dragStartY;
            }

            if (clientPos.x > x1 && clientPos.x < x2 &&
                clientPos.y > y1 && clientPos.y < y2) {
                draggedNodes.push(nodeList[i]);
            }
        }
        return draggedNodes;
    }

    private handleMouseUp() {
        this.isDragging = false;

        if (!this.dragHandlerExist) {
            const draggedNodes = this.getDraggedNodes();
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

    private handleMouseMove() {
        this.dragHandlerExist = false;
        if (this.selTarget) {
            if (this.selTarget.metadata) {
                if (this.selTarget.metadata.onMouseDrag && this.isDragging) {
                    this.selTarget.metadata.onMouseDrag();
                    this.dragHandlerExist = true;
                }
            }
        }

        const scene = this.mainScene.scene;
        if (!this.dragHandlerExist && this.isDragging) {
            this.guiLayer.updateDragIndicator(
                this.dragStartX, this.dragStartY,
                scene.pointerX, scene.pointerY);
        }
    }

    private setMouseHandler() {
        this.mainScene.scene.onPointerObservable.add((pointerInfo) => {
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
        });
    }

    private createLookTarget() {
        const sphere = BABYLON.MeshBuilder.CreateSphere("sphere",
            { diameter: 1, segments: 16 },
            this.mainScene.scene);
        sphere.position = new BABYLON.Vector3(90, 10, 90);
        sphere.isVisible = false;
        this.lookTarget = sphere;
    }

    private createCamera() {
        this.createLookTarget();

        const campos = this.lookTarget.position.clone();
        campos.addInPlace(new BABYLON.Vector3(3, 3, 3));

        const camera = new BABYLON.FollowCamera(
            "FollowCam",
            campos,
            this.mainScene.scene);

        camera.radius = 11;
        camera.heightOffset = 8;
        camera.rotationOffset = 225;
        camera.cameraAcceleration = 0.5;
        camera.maxCameraSpeed = 10;
        camera.lockedTarget = this.lookTarget;
        // camera.attachControl(true);
        // camera.inputs.clear();
        this.camera = camera;
    }

    private camUpdate(delta: number) {
        const lookXZDir = this.lookTarget.position.clone()
            .subtractInPlace(this.camera.position);
        lookXZDir.y = 0;
        lookXZDir.normalize();

        const angle = Math.atan2(lookXZDir.z, lookXZDir.x) + Math.PI / 2;
        const sideDir = new BABYLON.Vector3(Math.cos(angle), 0, Math.sin(angle));

        if (this.isKeyPressed("w") || this.isKeyPressed("W"))
            this.lookTarget.position.addInPlace(lookXZDir.scale(0.03 * delta));

        if (this.isKeyPressed("s") || this.isKeyPressed("S"))
            this.lookTarget.position.addInPlace(lookXZDir.scale(-0.03 * delta));

        if (this.isKeyPressed("a") || this.isKeyPressed("A"))
            this.lookTarget.position.addInPlace(sideDir.scale(0.03 * delta));

        if (this.isKeyPressed("d") || this.isKeyPressed("D"))
            this.lookTarget.position.addInPlace(sideDir.scale(-0.03 * delta));

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
            if (this.camera.fov > 2.0)
                this.camera.fov = 2.0;
        }

        if (this.isKeyPressed("ArrowUp"))
            this.lookTarget.position.y += 0.06 * delta;

        if (this.isKeyPressed("ArrowDown"))
            this.lookTarget.position.y -= 0.06 * delta;

        if (this.isKeyPressed("PageUp"))
            this.camera.heightOffset += 0.06 * delta;

        if (this.isKeyPressed("PageDown"))
            this.camera.heightOffset -= 0.06 * delta;
    }
    
    private isKeyPressed(key: string) {
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
    
    public update(delta: number) {
        this.guiLayer.update();
        this.camUpdate(delta);
    }
}