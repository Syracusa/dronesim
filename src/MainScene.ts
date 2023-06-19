import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { Terrain } from './Terrain';

export class MainScene {
    canvas: HTMLCanvasElement;
    engine: BABYLON.Engine;
    scene: BABYLON.Scene;

    constructor() {
        let canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
        this.canvas = canvas;
        let engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine
        this.engine = engine;
        let scene = this.createScene();
        this.scene = scene;

        new Terrain(this);

        engine.runRenderLoop(function () {
            scene.render();
        });

        window.addEventListener("resize", function () {
            engine.resize();
        });
    }

    createScene() {
        const engine = this.engine;
        const scene = new BABYLON.Scene(engine);

        const camera = new BABYLON.FreeCamera("camera1",
            new BABYLON.Vector3(50, 30, 40), scene);

        camera.setTarget(new BABYLON.Vector3(50, 0, 50));

        camera.attachControl(this.canvas, true);

        let light = new BABYLON.HemisphericLight("light",
            new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 0.7;
        return scene;
    };

}