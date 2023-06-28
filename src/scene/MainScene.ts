import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { Terrain } from './Terrain';
import { Controller } from "./Controller";

export class MainScene {
    canvas: HTMLCanvasElement;
    engine: BABYLON.Engine;
    scene: BABYLON.Scene;
    controller: Controller;
    shadowGenerator: BABYLON.ShadowGenerator;

    lastRender = performance.now();

    constructor() {
        const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
        this.canvas = canvas;
        const engine = new BABYLON.Engine(canvas, true);
        this.engine = engine;
        const scene = new BABYLON.Scene(engine);
        this.scene = scene;

        var options = new BABYLON.SceneOptimizerOptions();
        options.addOptimization(new BABYLON.HardwareScalingOptimization(0, 1));

        // Optimizer
        var optimizer = new BABYLON.SceneOptimizer(scene, options);

        this.createLight();

        new Terrain(this);
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

    startRenderLoop() {
        let scene = this.scene;
        const that = this;

        this.engine.runRenderLoop(function () {
            scene.render();
            /* Calculate Time betwween frames */
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

    /* Vec3 to Client */
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
}