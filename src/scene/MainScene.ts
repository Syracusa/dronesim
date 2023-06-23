import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { Terrain } from './Terrain';
import { Drone } from "./Drone";
import { Panel } from "./Panel";

interface Stats {
    fps: number;
}

export class MainScene {
    canvas: HTMLCanvasElement;
    engine: BABYLON.Engine;
    scene: BABYLON.Scene;
    panel: Panel;
    stats: Stats = {
        fps: 0
    }
    lastRender = performance.now();

    constructor() {
        let canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
        this.canvas = canvas;
        let engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine
        this.engine = engine;
        let scene = this.createScene();
        this.scene = scene;

        new Terrain(this);
        new Drone(this);
        this.panel = new Panel(this);

        const that = this;

        engine.runRenderLoop(function () {
            scene.render();
            /* Calculate Time betwween frames */
            let curr = performance.now();
            let delta = curr - that.lastRender;
            that.lastRender = curr;

            that.panel.updatePanelText();
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

        const light = new BABYLON.DirectionalLight("DirectionalLight",
            new BABYLON.Vector3(0, -1, 0.1), scene);
        light.intensity = 1.5;
        return scene;
    };

}