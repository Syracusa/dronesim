import { DroneManager } from "./DroneManager";
import { MainScene } from "./MainScene";
import * as GUI from "@babylonjs/gui/Legacy/legacy";
import * as BABYLON from "@babylonjs/core/Legacy/legacy";


interface DroneLink {
    linkLine: GUI.Line;
    linkText: GUI.TextBlock;
}

interface DroneGUI {
    nameCard: GUI.Button;
    links: DroneLink[];
}

export class GuiLayer {
    mainScene: MainScene;
    infoPanel: GUI.TextBlock;
    nodeInfo: GUI.TextBlock;
    dragIndicator: GUI.Rectangle;
    droneGUIs: DroneGUI[] = [];
    testDroneRec: GUI.Rectangle;

    droneManager: DroneManager;
    updateIntervalMs = 100;
    advencedTexture: GUI.AdvancedDynamicTexture;

    constructor(mainScene: MainScene, droneManager: DroneManager) {
        this.mainScene = mainScene;
        this.droneManager = droneManager;
        this.makePanel();
    }

    updateDroneLinkLines() {
        const drones = this.droneManager.droneList;
        for (let i = 0; i < drones.length; i++) {
            for (let j = i + 1; j < drones.length; j++) {
                const drone1 = drones[i];
                const drone2 = drones[j];
                const clientDrone1Pos = this.mainScene.worldVec3toClient(drone1.position);
                const clientDrone2Pos = this.mainScene.worldVec3toClient(drone2.position);
                
                const droneDistance = BABYLON.Vector3.Distance(drone1.position, drone2.position);

                if (this.droneGUIs[i].links.length < j - i) {
                    for (let k = this.droneGUIs[i].links.length; k < j - i; k++) {
                        let link = new Object() as DroneLink;
                        link.linkLine = new GUI.Line();
                        link.linkLine.lineWidth = 1.0;
                        link.linkLine.color = "white";
                        this.advencedTexture.addControl(link.linkLine);
                        this.droneGUIs[i].links.push(link);
                    }
                }
                
                const linkLine = this.droneGUIs[i].links[j - i - 1].linkLine;
                linkLine.x1 = clientDrone1Pos.x | 0;
                linkLine.y1 = clientDrone1Pos.y | 0;
                linkLine.x2 = clientDrone2Pos.x | 0;
                linkLine.y2 = clientDrone2Pos.y | 0;

                if (droneDistance > 15){
                    linkLine.isVisible = false;
                } else {
                    linkLine.isVisible = true;
                    if (droneDistance < 10){
                        linkLine.color = "green";
                        linkLine.alpha = 1.0;
                    } else if (droneDistance < 13){
                        linkLine.color = "yellow";
                        linkLine.alpha = 0.5;
                    } else {
                        linkLine.color = "red";
                        linkLine.alpha = 0.7;
                    }
                }
            }
        }
    }

    updateDroneNameCards() {
        const drones = this.droneManager.droneList;

        if (this.droneGUIs.length < drones.length) {
            for (let i = this.droneGUIs.length; i < drones.length; i++) {
                let droneGUI: DroneGUI = new Object() as DroneGUI;
                droneGUI.links = [];

                let card = GUI.Button.CreateSimpleButton("but " + i, "Drone " + i);
                card.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
                card.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
                card.color = "black";
                card.height = "12px";
                card.width = "45px";
                card.cornerRadius = 3;
                card.background = "yellow";
                card.fontSize = 10;
                card.alpha = 0.5;
                this.advencedTexture.addControl(card);

                droneGUI.nameCard = card;
                this.droneGUIs.push(droneGUI);
            }
        }

        for (let i = 0; i < drones.length; i++) {
            const onedrone = drones[i];
            const clientDronePos = this.mainScene.worldVec3toClient(onedrone.position);
            
            this.droneGUIs[i].nameCard.left = ((clientDronePos.x | 0) - 20) + "px";
            this.droneGUIs[i].nameCard.top = ((clientDronePos.y | 0) - 30) + "px";
        }
    }

    updatePanelText() {
        let text = "";
        text += "FPS: " + this.mainScene.engine.getFps().toFixed() + "\n";
        text += "Pointer: "
            + this.mainScene.scene.pointerX + " " + this.mainScene.scene.pointerY + "\n";
        this.infoPanel.text = text;
    }

    updateDragIndicator(x1: number, y1: number, x2: number, y2: number) {
        if (x1 > x2) {
            let tmp = x1;
            x1 = x2;
            x2 = tmp;
        }
        if (y1 > y2) {
            let tmp = y1;
            y1 = y2;
            y2 = tmp;
        }
        this.dragIndicator.left = x1 + "px";
        this.dragIndicator.top = y1 + "px";
        this.dragIndicator.width = (x2 - x1) + "px";
        this.dragIndicator.height = (y2 - y1) + "px";
    }

    makePanel() {
        let advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        // Style
        let style = advancedTexture.createStyle();
        style.fontSize = 3;
        style.fontStyle = "bold";

        let infoPanel = new GUI.TextBlock();
        infoPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        infoPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        infoPanel.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        infoPanel.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        infoPanel.text = "N/A";
        infoPanel.color = "white";
        infoPanel.height = "300px";
        infoPanel.fontSize = 10;
        advancedTexture.addControl(infoPanel);

        this.infoPanel = infoPanel;

        let nodeInfo = new GUI.TextBlock();
        nodeInfo.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        nodeInfo.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        nodeInfo.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        nodeInfo.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        nodeInfo.text = "No node selected";
        nodeInfo.color = "white";
        nodeInfo.height = "300px";
        nodeInfo.fontSize = 10;
        advancedTexture.addControl(nodeInfo);

        this.nodeInfo = nodeInfo;

        let dragIndicator = new GUI.Rectangle();
        dragIndicator.width = "1px";
        dragIndicator.height = "1px";
        dragIndicator.color = "white";
        dragIndicator.thickness = 1;
        dragIndicator.background = "black";
        dragIndicator.alpha = 0.5;
        dragIndicator.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        dragIndicator.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        dragIndicator.isPointerBlocker = false;
        dragIndicator.isVisible = true;
        advancedTexture.addControl(dragIndicator);
        this.dragIndicator = dragIndicator;


        this.advencedTexture = advancedTexture;
    }
}