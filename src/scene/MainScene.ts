import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { Terrain } from './Terrain';
import { Controller } from "./Controller";
import { Scenario } from "./Scenario";

export class MainScene {
    canvas: HTMLCanvasElement;
    engine: BABYLON.Engine;
    scene: BABYLON.Scene;
    controller: Controller;
    terrain: Terrain;
    highlightLayer: BABYLON.HighlightLayer;
    shadowGenerator: BABYLON.ShadowGenerator;

    renderWhenDirty: boolean = true;
    dirty: boolean = true;
    oldCampos: BABYLON.Vector3;
    scenario: Scenario;

    lastRender = performance.now();

    constructor() {
        const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
        this.canvas = canvas;
        const engine = new BABYLON.Engine(canvas, true, {stencil: true});
        this.engine = engine;
        const scene = new BABYLON.Scene(engine);
        this.scene = scene;
        const highlightLayer = new BABYLON.HighlightLayer("highlightLayer", scene);
        this.highlightLayer = highlightLayer;

        const USE_OPTIMIZER = false;
        if (USE_OPTIMIZER) {
            const options = new BABYLON.SceneOptimizerOptions();
            options.addOptimization(new BABYLON.HardwareScalingOptimization(0, 1));

            const optimizer = new BABYLON.SceneOptimizer(scene, options);
            optimizer.start();
        }

        this.createLight();

        this.terrain = new Terrain(this);
        this.controller = new Controller(this);

        scene.autoClear = false;
        scene.autoClearDepthAndStencil = false;
        this.startRenderLoop();

        window.addEventListener("resize", function () {
            engine.resize();
        });


    }
    
    updateScene(delta: number) {
        this.controller.update(delta);
    }

    checkCameraMoved() {
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

    startRenderLoop() {
        let scene = this.scene;
        const that = this;

        this.engine.runRenderLoop(function () {
            if (that.renderWhenDirty) {
                if (that.dirty) {
                    scene.render();
                    that.dirty = false;
                } else {
                    if (that.checkCameraMoved()) {
                        scene.render();
                    }
                }

            } else {
                scene.render();
            }

            /* Calculate Time between frames */
            let curr = performance.now();
            let delta = curr - that.lastRender;
            that.updateScene(delta);
            that.lastRender = curr;
        });
    }

    createLight() {
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
    };

    worldVec3toClient(vec3: BABYLON.Vector3): BABYLON.Vector3 {
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

    download(filename: string, contents: string) {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(contents));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();
        document.body.removeChild(element);
    }

    saveScene() {
        console.log('Save Scene');
        const terr = JSON.stringify(this.terrain.heights);

        const date = new Date();
        this.download('Scene'
            + date.toISOString().slice(0, 10).replace(/-/g, "")
            + '.dat', terr);
    }

    loadScene() {
        console.log('Load Scene');
        const input = document.createElement('input') as HTMLInputElement;
        input.type = 'file';
        input.onchange = _this => {
            const files = Array.from(input.files);
            files[0].text().then(text => {
                console.log(text);
                let heights = JSON.parse(text);
                this.terrain.heights = heights;
                this.terrain.drawTerrain();
            });
        };
        input.click();
        input.remove();
    }
}