import { MainScene } from './MainScene';
import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import GrassTexture from './static/grass.png';
import RockTexture from './static/rock.png';
import FloorTexture from './static/floor.png';

export class Terrain {
    heights: number[][] = [];
    mapsize = 100;
    mainScene: MainScene;
    mat;

    constructor(mainScene: MainScene) {
        this.mainScene = mainScene;
        this.mat = this.loadStdMat();

        this.initHeights();
        this.randomTerrainHeight(500);
        this.drawTerrain();

        /* TODO : Make water mesh */
    }

    loadTexture(imgurl: string) {
        const myDynamicTexture = new BABYLON.DynamicTexture("DynamicTexture",
            512, this.mainScene.scene);

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
        std.diffuseTexture = this.loadTexture(GrassTexture);
        std.specularColor = new BABYLON.Color3(0, 0, 0);
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
    }

    drawTerrain() {
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