import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { Terrain } from './Terrain';
import { Drone } from "./Drone";
import { Panel } from "./Panel";
import { Controller } from "./Controller";
import { ShiftHelper } from "./ShiftHelper";

export class MainScene {
    canvas: HTMLCanvasElement;
    engine: BABYLON.Engine;
    scene: BABYLON.Scene;
    panel: Panel;
    controller: Controller;
    drone: Drone;
    shiftHelper: ShiftHelper;

    lastRender = performance.now();

    constructor() {
        const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
        this.canvas = canvas;
        const engine = new BABYLON.Engine(canvas, true);
        this.engine = engine;
        const scene = new BABYLON.Scene(engine);
        this.scene = scene;

        this.createLight();

        new Terrain(this);
        this.drone = new Drone(this);
        this.panel = new Panel(this);
        this.controller = new Controller(this);
        this.shiftHelper = new ShiftHelper(this);

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

            that.panel.updatePanelText();
        });
    }

    createLight() {
        const light = new BABYLON.DirectionalLight("DirectionalLight",
            new BABYLON.Vector3(0, -1, 0.1), this.scene);
        light.intensity = 1.5;
    };


}