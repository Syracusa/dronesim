import { MainScene } from './MainScene';
import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import GrassTexture from '../static/grass.png';

import SkyboxNx from '../static/skybox/skybox_nx.jpg';
import SkyboxNy from '../static/skybox/skybox_ny.jpg';
import SkyboxNz from '../static/skybox/skybox_nz.jpg';
import SkyboxPx from '../static/skybox/skybox_px.jpg';
import SkyboxPy from '../static/skybox/skybox_py.jpg';
import SkyboxPz from '../static/skybox/skybox_pz.jpg';

export class Terrain {
    heights: number[][] = [];
    tiles: BABYLON.Mesh[] = [];
    mapsize = 200;
    mainScene: MainScene;
    mat;

    constructor(mainScene: MainScene) {
        this.mainScene = mainScene;
        this.mat = this.loadStdMat();

        this.initHeights();
        this.randomTerrainHeight(100);
        this.drawTerrain();

        this.createOcean();
        this.createSkyBox();
    }

    /* Dispose terrain meshes */
    disposeTerrain() {
        this.tiles.forEach((mesh) => {
            mesh.dispose(false, true);
        });
        this.tiles = [];
    }

    /* Create SkyBox */
    createSkyBox() {
        const skybox = BABYLON.MeshBuilder.CreateBox("skyBox",
            { size: 1000.0 },
            this.mainScene.scene);
        const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", this.mainScene.scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture(
            "",
            this.mainScene.scene,
            [], true, [SkyboxPx, SkyboxPy, SkyboxPz, SkyboxNx, SkyboxNy, SkyboxNz]
        );
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.disableLighting = true;
        skybox.material = skyboxMaterial;
    }

    /* Create ocean mesh */
    createOcean() {
        const ocean = BABYLON.MeshBuilder.CreateGround("ocean",
            { width: this.mapsize, height: this.mapsize }, this.mainScene.scene);
        ocean.position.x = this.mapsize / 2;
        ocean.position.z = this.mapsize / 2;
        ocean.position.y = 0.1;
        const oceanMat = new BABYLON.StandardMaterial("oceanMat", this.mainScene.scene);
        oceanMat.diffuseColor = new BABYLON.Color3(0.11, 0.11, 0.4);
        oceanMat.alpha = 0.8;
        ocean.material = oceanMat;
        ocean.metadata = { type: "terrain" };
        ocean.receiveShadows = true;
    }

    loadStdMat() {
        let std = new BABYLON.StandardMaterial("standard", this.mainScene.scene);
        std.diffuseTexture = new BABYLON.Texture(GrassTexture, this.mainScene.scene);

        std.specularColor = new BABYLON.Color3(0.04, 0.04, 0.04);
        return std;
    }

    drawTile(xstart: number, xend: number, ystart: number, yend: number) {
        let paths: BABYLON.Vector3[][] = [];
        for (let i = xstart; i <= xend; i++) {
            let onePath: BABYLON.Vector3[] = [];
            for (let j = ystart; j <= yend; j++) {
                onePath.push(new BABYLON.Vector3(
                    i,
                    this.heights[i][j],
                    j));
            }
            paths.push(onePath);
        }
        let terrain = BABYLON.MeshBuilder.CreateRibbon("ribbon",
            { pathArray: paths, sideOrientation: BABYLON.Mesh.DOUBLESIDE },
            this.mainScene.scene);

        terrain.material = this.mat;
        terrain.metadata = { type: "terrain" };
        terrain.receiveShadows = true;
        this.tiles.push(terrain);
    }

    drawTerrain() {
        this.disposeTerrain();
        const tilesize = 10;
        const fragsize = (this.mapsize / tilesize);
        for (let xtile = 0; xtile < fragsize; xtile++) {
            for (let ytile = 0; ytile < fragsize; ytile++) {
                this.drawTile(
                    xtile * tilesize, (xtile + 1) * tilesize,
                    ytile * tilesize, (ytile + 1) * tilesize);
            }
        }
    }

    randomTerrainHeight(num: number) {
        for (let i = 20; i < this.mapsize; i++) {
            for (let j = 20; j < this.mapsize; j++) {
                this.raiseHeightPoint(
                    i, j, Math.random() * 0.3 - 0.15);
            }
        }

        for (let i = 0; i < num; i++) {
            this.raiseHeightPoint(
                ((Math.random() * (this.mapsize - 40)) + 20) | 0,
                ((Math.random() * (this.mapsize - 40)) + 20) | 0,
                Math.random() * 3.0 - 1);
        }
    }

    initHeights() {
        for (let i = 0; i < this.mapsize + 1; i++) {
            let xarr: number[] = [];
            for (let j = 0; j < this.mapsize + 1; j++) {
                xarr.push(0);
            }
            this.heights.push(xarr);
        }
    }

    sigmoid(z: number) {
        return 1 / (1 + Math.exp(-z));
    }

    raiseHeightPoint(xPos: number, yPos: number, intensity: number) {
        let range = 10;
        for (let i = xPos - range; i < xPos + range; i++) {
            for (let j = yPos - range; j < yPos + range; j++) {
                if (i > -1 && i < this.mapsize &&
                    j > -1 && j < this.mapsize) {

                    let xdiff = Math.abs(xPos - i);
                    let ydiff = Math.abs(yPos - j);

                    let diff = Math.sqrt(xdiff * xdiff + ydiff * ydiff);

                    // this.heights[i][j] += intensity * ((this.sigmoid(diff * -1 - 10)) + 0.5);
                    this.heights[i][j] += Math.cos(diff / 15 * 2 / Math.PI) * intensity;
                }
            }
        }
    }
}