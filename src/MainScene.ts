import * as BABYLON from 'babylonjs'
import GrassTexture from './static/grass.png';

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
            new BABYLON.Vector3(0, 5, -10), scene);

        camera.setTarget(BABYLON.Vector3.Zero());

        camera.attachControl(this.canvas, true);

        const light = new BABYLON.HemisphericLight("light",
            new BABYLON.Vector3(0, 1, 0), scene);

        light.intensity = 0.7;

        const sphere = BABYLON.MeshBuilder.CreateSphere("sphere",
            { diameter: 2, segments: 32 }, scene);

        sphere.position.y = 1;

        const mat = new BABYLON.StandardMaterial("mat", scene);
        mat.diffuseTexture = this.loadTexture();

        const ground = BABYLON.MeshBuilder.CreateGround("ground",
            { width: 6, height: 6 }, scene);
        ground.material = mat;

        return scene;
    };

    loadTexture() {
        const myDynamicTexture = new BABYLON.DynamicTexture("DynamicTexture",
            { width: 512, height: 512},  this.scene);

        const img = new Image();
        img.src = GrassTexture;
        img.onload = function () {
            const ctx = myDynamicTexture.getContext();
            ctx.drawImage(this, 0, 0);
            myDynamicTexture.update();
        }

        return myDynamicTexture;
    }
}