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

        const USE_OPTIMIZER = false;
        if (USE_OPTIMIZER){
            const options = new BABYLON.SceneOptimizerOptions();
            options.addOptimization(new BABYLON.HardwareScalingOptimization(0, 1));

            const optimizer = new BABYLON.SceneOptimizer(scene, options);
            optimizer.start();
        }

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
    async saveFile() {
        // create a new handle
        const newHandle = await window.showSaveFilePicker();

        await newHandle.requestPermission();
      
        // create a FileSystemWritableFileStream to write to
        const writableStream = await newHandle.createWritable();
      
        // write our file
        await writableStream.write('test');
      
        // close the file and write the contents to disk.
        await writableStream.close();
      }

    saveScene(){
        console.log('Save Scene');
        this.saveFile();
    }

    loadScene(){
        console.log('Load Scene');
        let input = document.createElement('input') as HTMLInputElement;
        input.type = 'file';
        input.onchange = _this => {
                  let files =   Array.from(input.files);
                  console.log(files);
              };
        input.click();
        input.remove();
    }
}