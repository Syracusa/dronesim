import { DroneManager, DroneMetadata } from "./DroneManager";
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
    nodeInfoTarget: BABYLON.Mesh;

    droneManager: DroneManager;
    useUpdateInterval = true;
    updateIntervalMs = 20;
    advancedTexture: GUI.AdvancedDynamicTexture;

    menuButtons: GUI.Button[] = [];
    menuOpened: boolean = true;
    menuButtonOffset = 0;

    lastUpdate = 0;


    constructor(mainScene: MainScene, droneManager: DroneManager) {
        this.mainScene = mainScene;
        this.droneManager = droneManager;
        this.makeControls();
        this.backgroundWork();
    }

    backgroundWork() {
        const that = this;
        this.updateNodeInfo(this.nodeInfoTarget);
        setTimeout(() => {
            that.backgroundWork();
        }, 1000);
    }

    update() {
        if (this.useUpdateInterval) {
            if (performance.now() - this.lastUpdate < this.updateIntervalMs)
                return;
            this.lastUpdate = performance.now();
        }

        this.updatePanelText();
        this.updateDroneNameCards();
        this.updateDroneLinkLines();
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
                        this.advancedTexture.addControl(link.linkLine);

                        link.linkText = new GUI.TextBlock();
                        link.linkText.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
                        link.linkText.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
                        link.linkText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
                        link.linkText.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;

                        link.linkText.text = "Link";
                        link.linkText.color = "white";
                        link.linkText.height = "15px";
                        link.linkText.alpha = 0.5;
                        link.linkText.fontSize = 10;
                        this.advancedTexture.addControl(link.linkText);

                        this.droneGUIs[i].links.push(link);
                    }
                }


                const linkLine = this.droneGUIs[i].links[j - i - 1].linkLine;
                linkLine.x1 = clientDrone1Pos.x | 0;
                linkLine.y1 = clientDrone1Pos.y | 0;
                linkLine.x2 = clientDrone2Pos.x | 0;
                linkLine.y2 = clientDrone2Pos.y | 0;

                const linkText = this.droneGUIs[i].links[j - i - 1].linkText;
                linkText.top = ((clientDrone1Pos.y + clientDrone2Pos.y) / 2) | 0;
                linkText.left = ((clientDrone1Pos.x + clientDrone2Pos.x) / 2) | 0;
                linkText.text = droneDistance.toFixed(1);


                if (droneDistance > 15) {
                    linkLine.isVisible = false;
                    linkText.isVisible = false;
                } else {
                    linkLine.isVisible = true;
                    linkText.isVisible = true;
                    if (droneDistance < 10) {
                        linkLine.color = "green";
                        linkLine.alpha = 1.0;
                    } else if (droneDistance < 13) {
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

    updateNodeInfo(target: BABYLON.Mesh) {
        if (target == null) {
            this.nodeInfo.text = "No target";
            return;
        }

        const meta = target.metadata as DroneMetadata;

        if (!meta) {
            return;
        }

        if (meta.type == "drone") {
            this.nodeInfo.text = "Node Index : " + meta.idx + "\n";
            this.nodeInfo.text += "Tx Bytes : " + meta.txBytes + " Rx Bytes : " + meta.rxBytes + "\n";

            this.nodeInfo.text += "Routing Table\n";
            for (let i = 0; i < meta.routingTable.length; i++) {
                if (meta.routingTable[i].hopCount != 0) {
                    let routeText = "";
                    routeText += meta.idx;
                    for (let hop = 0; hop < meta.routingTable[i].hopCount; hop++) {
                        routeText += " => " + meta.routingTable[i].path[hop];
                    }
                    this.nodeInfo.text += routeText + "\n";
                }
            }
        } else {
            console.log('type :' + meta.type);
        }

        if (meta.dirty) {
            meta.dirty = false;
            this.mainScene.dirty = true;
        }
    }

    updateDroneNameCards() {
        const that = this;
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
                card.zIndex = 5;
                card.onPointerUpObservable.add(function () {
                    that.nodeInfoTarget = drones[i];
                    that.updateNodeInfo(drones[i]);
                });

                this.advancedTexture.addControl(card);

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

    sceneSaveButtonClicked() {

    }

    menuViewToggleButtonClicked() {
        this.menuOpened = !this.menuOpened;
        for (let i = 0; i < this.menuButtons.length; i++) {
            this.menuButtons[i].isVisible = this.menuOpened;
        }
    }

    createMenuButton(name: string, callback: () => void) {
        const sceneSaveButton = GUI.Button.CreateSimpleButton("but", name);
        sceneSaveButton.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        sceneSaveButton.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        sceneSaveButton.color = "black";
        sceneSaveButton.height = "12px";
        sceneSaveButton.width = "45px";
        sceneSaveButton.top = this.menuButtonOffset + "px";
        sceneSaveButton.cornerRadius = 3;
        sceneSaveButton.background = "#d4d4d4";
        sceneSaveButton.fontSize = 10;
        sceneSaveButton.alpha = 1.0
        sceneSaveButton.zIndex = 5;
        sceneSaveButton.isVisible = this.menuOpened;
        sceneSaveButton.onPointerUpObservable.add(function () {
            callback();
        });

        this.advancedTexture.addControl(sceneSaveButton);
        this.menuButtons.push(sceneSaveButton);

        this.menuButtonOffset += 12;
    }

    makeControls() {
        const that = this;
        const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        this.advancedTexture = advancedTexture;

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
        nodeInfo.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        nodeInfo.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        nodeInfo.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        nodeInfo.text = "No node selected";
        nodeInfo.color = "white";
        // nodeInfo.height = "300px";
        nodeInfo.resizeToFit = true;
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


        const menuViewToggleButton = GUI.Button.CreateSimpleButton("but", "Menu");
        menuViewToggleButton.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        menuViewToggleButton.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        menuViewToggleButton.color = "black";
        menuViewToggleButton.height = "12px";
        menuViewToggleButton.width = "45px";
        menuViewToggleButton.cornerRadius = 3;
        menuViewToggleButton.background = "grey";
        menuViewToggleButton.fontSize = 10;
        menuViewToggleButton.alpha = 1.0
        menuViewToggleButton.zIndex = 5;
        menuViewToggleButton.onPointerUpObservable.add(function () {
            that.menuViewToggleButtonClicked();
        });
        advancedTexture.addControl(menuViewToggleButton);

        this.menuButtonOffset = 12;

        this.createMenuButton("Save", function () {
            that.mainScene.saveScene();
        });

        this.createMenuButton("Load", function () {
            that.mainScene.loadScene();
        });


    }
}