import { MainScene } from './MainScene';
import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import GrassTexture from './static/grass.png';
import GrassNTexture from './static/grassn.png';
import RockTexture from './static/rock.png';
import RockNTexture from './static/rockn.png';
// import GroundTexture from './static/ground.png';
import FloorTexture from './static/floor.png';

import {
    TerrainMaterial,
    TriPlanarMaterial
} from '@babylonjs/materials';
import { StandardMaterial } from 'babylonjs';

export class Terrain {
    heights: number[][] = [];
    mapsize = 100;
    mainScene: MainScene;

    constructor(mainScene: MainScene) {
        this.mainScene = mainScene;

        this.initHeights();
        this.randomTerrainHeight(500);
        this.drawTerrain();

    }

    loadTexture(imgurl: string) {
        const myDynamicTexture = new BABYLON.DynamicTexture("DynamicTexture",
            512, this.mainScene.scene);
        myDynamicTexture.updateSamplingMode(9);

        const img = new Image();
        img.src = imgurl;
        img.onload = function () {
            const ctx = myDynamicTexture.getContext();
            ctx.drawImage(this, 0, 0);
            myDynamicTexture.update();
        }

        return myDynamicTexture;
    }

    loadStdMat() {
        let std = new BABYLON.StandardMaterial("standard", this.mainScene.scene);
        std.diffuseTexture = this.loadTexture(FloorTexture);

        return std;
    }

    loadTriMat() {
        let triPlanarMaterial = new TriPlanarMaterial("triplanar", this.mainScene.scene);
        triPlanarMaterial.diffuseTextureX = this.loadTexture(RockTexture);
        triPlanarMaterial.diffuseTextureY = this.loadTexture(GrassTexture);
        triPlanarMaterial.diffuseTextureZ = this.loadTexture(FloorTexture);
        // triPlanarMaterial.normalTextureX = this.loadTexture(RockNTexture);
        // triPlanarMaterial.normalTextureY = this.loadTexture(RockNTexture);
        // triPlanarMaterial.normalTextureZ = this.loadTexture(RockNTexture);
        triPlanarMaterial.specularPower = 32;
        triPlanarMaterial.tileSize = 1.5;

        return triPlanarMaterial;
    }

    drawTerrain() {
        let paths: BABYLON.Vector3[][] = [];
        for (let i = 0; i < this.mapsize; i++) {
            let onePath: BABYLON.Vector3[] = [];
            for (let j = 0; j < this.mapsize; j++) {
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

        // terrain.material = this.loadTriMat();
        terrain.material = this.loadStdMat();
    }

    randomTerrainHeight(num: number) {
        for (let i = 0; i < this.mapsize; i++) {
            for (let j = 0; j < this.mapsize; j++) {
                this.raiseHeightPoint(
                    i, j, Math.random() * 0.3 - 0.15);
            }
        }

        for (let i = 0; i < num; i++) {
            this.raiseHeightPoint(
                (Math.random() * this.mapsize) | 0,
                (Math.random() * this.mapsize) | 0,
                Math.random() * 3.0 - 1);
        }
    }

    initHeights() {
        for (let i = 0; i < this.mapsize + 1; i++) {
            let xarr: number[] = [];
            for (let j = 0; j < this.mapsize + 1; j++) {
                // xarr.push(Math.random() + 10);
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

                    this.heights[i][j] += intensity * (this.sigmoid(diff * -1 + 3)) * 2;
                }
            }
        }
    }

}