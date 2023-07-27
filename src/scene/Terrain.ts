import { MainScene } from './MainScene';
import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import GrassTexture from '../static/grass.png';

import SkyboxNx from '../static/skybox/skybox_nx.jpg';
import SkyboxNy from '../static/skybox/skybox_ny.jpg';
import SkyboxNz from '../static/skybox/skybox_nz.jpg';
import SkyboxPx from '../static/skybox/skybox_px.jpg';
import SkyboxPy from '../static/skybox/skybox_py.jpg';
import SkyboxPz from '../static/skybox/skybox_pz.jpg';

import TreeModel from '../static/glb/Tree2.glb';
import StoneModel2 from '../static/glb/Stone2.glb';


export class Terrain {
    heights: number[][] = [];
    tiles: BABYLON.Mesh[] = [];
    mapsize = 200;
    mat: BABYLON.StandardMaterial;
    treeMeshParts: BABYLON.Mesh[] = [];
    stoneMeshParts: BABYLON.Mesh[] = [];

    stoneScale = 0.5;
    stoneModelScale = new BABYLON.Vector3(0.243, 0.243, 0.243);

    treeScale = 0.3;
    treeModelScale = new BABYLON.Vector3(0.232, 1, 0.232);

    constructor(private readonly mainScene: MainScene) {
        this.mat = this.loadStdMat();

        this.initHeights();
        this.randomTerrainHeight(100);
        this.drawTerrain();

        this.createOcean();
        this.createSkyBox();

        const DRAW_TREE = 0;
        if (DRAW_TREE)
            this.loadTerrainObjectModel(TreeModel, Terrain.afterTreeLoad);

        const DRAW_STONE = 0;
        if (DRAW_STONE)
            this.loadTerrainObjectModel(StoneModel2, Terrain.afterStoneLoad);
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
            "", this.mainScene.scene,
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
        const std = new BABYLON.StandardMaterial("standard", this.mainScene.scene);
        std.diffuseTexture = new BABYLON.Texture(GrassTexture, this.mainScene.scene);
        std.specularColor = new BABYLON.Color3(0.04, 0.04, 0.04);
        return std;
    }

    drawTile(xstart: number, xend: number, ystart: number, yend: number) {
        const paths: BABYLON.Vector3[][] = [];
        for (let i = xstart; i <= xend; i++) {
            const onePath: BABYLON.Vector3[] = [];
            for (let j = ystart; j <= yend; j++) {
                onePath.push(new BABYLON.Vector3(
                    i, this.heights[i][j], j));
            }
            paths.push(onePath);
        }

        const terrain = BABYLON.MeshBuilder.CreateRibbon("ribbon",
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
            const xarr: number[] = [];
            for (let j = 0; j < this.mapsize + 1; j++) {
                xarr.push(0);
            }
            this.heights.push(xarr);
        }
    }

    raiseHeightPoint(xPos: number, yPos: number, intensity: number) {
        const range = 10;
        // const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));
        for (let i = xPos - range; i < xPos + range; i++) {
            for (let j = yPos - range; j < yPos + range; j++) {
                if (i > -1 && i < this.mapsize &&
                    j > -1 && j < this.mapsize) {

                    const xdiff = Math.abs(xPos - i);
                    const ydiff = Math.abs(yPos - j);

                    const diff = Math.sqrt(xdiff * xdiff + ydiff * ydiff);

                    // this.heights[i][j] += intensity * ((this.sigmoid(diff * -1 - 10)) + 0.5);
                    this.heights[i][j] += Math.cos(diff / 15 * 2 / Math.PI) * intensity;
                }
            }
        }
    }

    getTerrainSlope(x: number, y: number) {
        if (x < 0 || x > this.mapsize || y < 0 || y > this.mapsize)
            return 0;

        const x1 = Math.floor(x);
        const y1 = Math.floor(y);
        let x2 = Math.ceil(x);
        let y2 = Math.ceil(y);

        if ((x | 0) == x)
            x2 += 1;
        if ((y | 0) == y)
            y2 += 1;

        const heights = [
            this.heights[x1][y1],
            this.heights[x2][y1],
            this.heights[x2][y2],
            this.heights[x1][y2]
        ];

        const min = Math.min(...heights);
        const max = Math.max(...heights);

        return max - min;
    }

    getInterpolratedHeight(x: number, y: number) {
        if (x < 0 || x > this.mapsize || y < 0 || y > this.mapsize)
            return 0;

        const x1 = Math.floor(x);
        const x2 = Math.ceil(x);
        const y1 = Math.floor(y);
        const y2 = Math.ceil(y);

        const xdiff = x - x1;
        const ydiff = y - y1;

        const h1 = this.heights[x1][y1] * (1 - xdiff) + this.heights[x2][y1] * xdiff;
        const h2 = this.heights[x1][y2] * (1 - xdiff) + this.heights[x2][y2] * xdiff;

        return h1 * (1 - ydiff) + h2 * ydiff;
    }

    createTreeAt(x: number, y: number) {
        const height = this.getInterpolratedHeight(x, y);
        if (height < 0.2)
            return;

        const matrix = BABYLON.Matrix.Translation(
            (1 / this.treeModelScale.x / this.treeScale) * x,
            (1 / this.treeModelScale.y / this.treeScale) * height - 0.1,
            (1 / this.treeModelScale.z / this.treeScale) * y * -1);
        this.treeMeshParts.forEach((part) => {
            part.thinInstanceAdd(matrix);
        });
    }

    createTrees() {
        console.log(this.treeMeshParts[0]);
        for (let i = 0; i < this.mapsize; i++) {
            for (let j = 0; j < this.mapsize; j++) {
                if (Math.random() > 0.01)
                    continue;
                this.createTreeAt(i, j);
                for (let k = 0; k < (1 - this.getTerrainSlope(i, j)) * 10; k++) {
                    this.createTreeAt(
                        i + (Math.random() - 0.5) * (Math.random() * k),
                        j + (Math.random() - 0.5) * (Math.random() * k));
                }
            }
        }
    }

    static afterTreeLoad(ctx: Terrain, newMeshes: BABYLON.AbstractMesh[]) {
        console.log("Tree Loaded");
        newMeshes[0].position = BABYLON.Vector3.Zero();
        newMeshes[0].scalingDeterminant = ctx.treeScale;

        for (let i = 1; i < newMeshes.length; i++) {
            const part = newMeshes[i] as BABYLON.Mesh;
            console.log(part.rotation);
            console.log(part.scaling)

            part.rotate(BABYLON.Axis.Y, Math.PI, BABYLON.Space.LOCAL);
            ctx.treeMeshParts.push(part);
        }

        ctx.createTrees();
    }

    createStoneAt(x: number, y: number) {
        const height = this.getInterpolratedHeight(x, y);
        if (height < 0.2)
            return;

        const matrix = BABYLON.Matrix.Translation(
            (1 / this.stoneModelScale.x / this.stoneScale) * x,
            (1 / this.stoneModelScale.y / this.stoneScale) * height - 0.3,
            (1 / this.stoneModelScale.z / this.stoneScale) * y * -1);
        this.stoneMeshParts.forEach((part) => {
            part.thinInstanceAdd(matrix);
        });
    }

    createStones() {
        console.log(this.stoneMeshParts[0]);
        for (let i = 0; i < this.mapsize; i++) {
            for (let j = 0; j < this.mapsize; j++) {
                if (Math.random() > 0.01)
                    continue;
                this.createStoneAt(i, j);
                const slope = this.getTerrainSlope(i, j);
                for (let k = 0; k < slope * 10; k++) {
                    this.createStoneAt(
                        i + (Math.random() - 0.5) * (Math.random() * k),
                        j + (Math.random() - 0.5) * (Math.random() * k));
                }
            }
        }
    }

    static afterStoneLoad(ctx: Terrain, newMeshes: BABYLON.AbstractMesh[]) {
        console.log("Stone Loaded");
        newMeshes[0].position = BABYLON.Vector3.Zero();
        newMeshes[0].scalingDeterminant = ctx.stoneScale;

        for (let i = 1; i < newMeshes.length; i++) {
            const part = newMeshes[i] as BABYLON.Mesh;
            console.log(part.rotation);
            console.log(part.scaling)

            part.rotate(BABYLON.Axis.Y, Math.PI, BABYLON.Space.LOCAL);
            ctx.stoneMeshParts.push(part);
        }

        ctx.createStones();
    }

    loadTerrainObjectModel(
        glbpath: string,
        callback: (ctx: Terrain, meshs: BABYLON.AbstractMesh[]) => void) {
            
        BABYLON.SceneLoader.ImportMesh("",
            glbpath.replace(glbpath.split('\\').pop().split('/').pop(), ''),
            glbpath.split('\\').pop().split('/').pop(),
            this.mainScene.scene,
            (newMeshes) => {
                callback(this, newMeshes);
            }
        );
    }

}