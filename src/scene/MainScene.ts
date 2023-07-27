import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { Terrain } from './Terrain';
import { Controller } from "./Controller";

export class MainScene {
    /* Don't change order */
    private readonly canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
    public readonly engine = new BABYLON.Engine(this.canvas, true, {stencil: true});
    public readonly scene = new BABYLON.Scene(this.engine);
    public readonly highlightLayer = new BABYLON.HighlightLayer("highlightLayer", this.scene);
    private readonly controller = new Controller(this);
    readonly terrain = new Terrain(this);

    private readonly renderWhenDirty: boolean = true;
    private readonly useOptimizer: boolean = false;
    private oldCampos: BABYLON.Vector3;
    private lastRender = performance.now();
    
    public shadowGenerator: BABYLON.ShadowGenerator;
    public dirty = true;

    constructor() {
        if (this.useOptimizer) {
            const options = new BABYLON.SceneOptimizerOptions();
            options.addOptimization(new BABYLON.HardwareScalingOptimization(0, 1));
            new BABYLON.SceneOptimizer(this.scene, options).start();
        }

        this.scene.autoClear = false;
        this.scene.autoClearDepthAndStencil = false;
        
        this.createLight();
        this.startRenderLoop();

        window.addEventListener("resize", () => {
            this.engine.resize();
        });
    }
    
    private updateScene(delta: number) {
        this.controller.update(delta);
    }

    private checkCameraMoved() {
        const campos = this.scene.activeCamera.position;
        if (!this.oldCampos) {
            this.oldCampos = campos;
            return true;
        }
        const diff = campos.subtract(this.oldCampos);
        const len = diff.length();
        if (len > 0.0001) {
            this.oldCampos = campos;
            return true;
        }
        return false;
    }

    private startRenderLoop() {
        const scene = this.scene;
        this.engine.runRenderLoop(() => {
            if (this.renderWhenDirty) {
                if (this.dirty) {
                    scene.render();
                    this.dirty = false;
                } else {
                    if (this.checkCameraMoved()) {
                        scene.render();
                    }
                }

            } else {
                scene.render();
            }

            /* Calculate Time between frames */
            const curr = performance.now();
            const delta = curr - this.lastRender;
            this.updateScene(delta);
            this.lastRender = curr;
        });
    }

    private createLight() {
        const light = new BABYLON.DirectionalLight("DirectionalLight",
            new BABYLON.Vector3(0, -1, 0.1), this.scene);
        light.intensity = 1.5;
        light.position = new BABYLON.Vector3(0, 100, 0);
        light.shadowMinZ = 0.1;
        light.shadowMaxZ = 1000;

        const shadowGenerator = new BABYLON.ShadowGenerator(1024, light);
        shadowGenerator.useBlurExponentialShadowMap = true;
        this.shadowGenerator = shadowGenerator;

        /* Ambient Light */
        const ambientLight = new BABYLON.HemisphericLight("ambientLight",
            new BABYLON.Vector3(0, 1, 0), this.scene);
        ambientLight.intensity = 0.2;
    }

    public worldVec3toClient(vec3: BABYLON.Vector3): BABYLON.Vector3 {
        const scene = this.scene;
        const camera = scene.activeCamera;
        const transform = BABYLON.Vector3.Project(
            vec3,
            BABYLON.Matrix.Identity(),
            scene.getTransformMatrix(),
            // camera.getTransformationMatrix(),
            camera.viewport.toGlobal(
                scene.getEngine().getRenderWidth(true),
                scene.getEngine().getRenderHeight(true)));

        return transform;
    }

    private download(filename: string, contents: string) {
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(contents));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();
        document.body.removeChild(element);
    }

    public saveScene() {
        console.log('Save Scene');
        const terr = JSON.stringify(this.terrain.heights);

        const date = new Date();
        this.download('Scene'
            + date.toISOString().slice(0, 10).replace(/-/g, "")
            + '.dat', terr);
    }

    public loadScene() {
        console.log('Load Scene');
        const input = document.createElement('input') as HTMLInputElement;
        input.type = 'file';
        input.onchange = () => {
            const files = Array.from(input.files);
            files[0].text().then(text => {
                console.log(text);
                const heights = JSON.parse(text);
                this.terrain.heights = heights;
                this.terrain.drawTerrain();
            });
        };
        input.click();
        input.remove();
    }
}