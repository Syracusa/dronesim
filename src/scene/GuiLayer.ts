import { NodeManager, Node } from "./NodeManager";
import { MainScene } from "./MainScene";
import * as GUI from "@babylonjs/gui/Legacy/legacy";
import * as BABYLON from "@babylonjs/core/Legacy/legacy";

interface DroneLink {
    linkLine: GUI.Line;
    linkText: GUI.TextBlock;
}

interface NodeGUI {
    nameCard: GUI.Button;
    links: DroneLink[];
}

export class GuiLayer {
    mainScene: MainScene;
    infoPanel: GUI.TextBlock;
    nodeInfo: GUI.TextBlock;
    dragIndicator: GUI.Rectangle;
    nodeGUIs: NodeGUI[] = [];
    targetNodeIdx: number = -1;

    nodeManager: NodeManager;
    useUpdateInterval = true;
    updateIntervalMs = 20;
    advancedTexture: GUI.AdvancedDynamicTexture;

    menuButtons: GUI.Button[] = [];
    menuOpened: boolean = true;
    menuButtonOffset = 0;

    drawLinks = true;

    lastUpdate = 0;

    static beautifulColors = [
        "#FF0000", "#FFC0CB", "#3A3B3C", "#4B0150", "#151B54", "#1E90FF", "#EB5406", "#52595D",
        "#F8F0E3", "#7FFFD4", "#728FCE", "#357EC7", "#00BFFF", "#808000", "#FFDB58", "#16F529",
        "#43C6DB", "#E67451", "#000000", "#ADD8E6", "#800080", "#8B8000", "#ECC5C0", "#008000",
        "#0C090A", "#AA6C39", "#00008B", "#36013F", "#454545", "#00FF00", "#2B65EC", "#0000FF",
        "#87CEEB", "#FDD017", "#6F4E37", "#34A56F", "#5EFB6E", "#686A6C", "#00FFFF", "#D4AF37",
        "#006400", "#A52A2A", "#800000", "#C0C0C0", "#8B0000", "#FFDF00", "#666362", "#FEFCFF",
        "#FFD700", "#FFFF00", "#D3D3D3", "#BCC6CC", "#98AFC7", "#1589FF", "#F62817", "#F70D1A",
        "#F8F6F0", "#4863A0", "#FFCE44", "#966F33", "#7E3517", "#123456", "#000080", "#008080",
        "#FAAFBA", "#625D5D", "#E5E4E2", "#F5F5DC", "#F6BE00", "#E75480", "#0041C2", "#FFFDD0",
        "#808080", "#A9A9A9", "#9D00FF", "#FF6700", "#368BC1", "#FFFFFF", "#29465B", "#C2DFFF",
        "#B87333", "#CD7F32", "#E41B17", "#95B9C7", "#FFA500", "#93917C", "#E1D9D1", "#90EE90",
        "#FFE87C", "#1569C7", "#F535AA", "#DADBDD", "#FFCCCB", "#FF00FF",
    ];

    constructor(mainScene: MainScene, nodeManager: NodeManager) {
        this.mainScene = mainScene;
        this.nodeManager = nodeManager;
        this.makeControls();
        this.backgroundWork();

    }

    backgroundWork() {
        const that = this;
        this.updateNodeInfo();
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
        this.updateDroneButtons();
        this.updateDroneLinkLines();
    }

    updateDroneLinkLines() {
        const nodes = this.nodeManager.nodeList;
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const node1 = nodes[i];
                const node2 = nodes[j];
                const clientDrone1Pos = this.mainScene.worldVec3toClient(node1.getPosition());
                const clientDrone2Pos = this.mainScene.worldVec3toClient(node2.getPosition());

                const nodeDistance = BABYLON.Vector3.Distance(node1.getPosition(), node2.getPosition());

                if (this.nodeGUIs[i].links.length < j - i) {
                    for (let k = this.nodeGUIs[i].links.length; k < j - i; k++) {
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

                        this.nodeGUIs[i].links.push(link);
                    }
                }


                const linkLine = this.nodeGUIs[i].links[j - i - 1].linkLine;
                const linkText = this.nodeGUIs[i].links[j - i - 1].linkText;

                let shouldDraw = true;
                if (Math.abs(clientDrone1Pos.z) > 1.0 || Math.abs(clientDrone2Pos.z) > 1.0)
                    shouldDraw = false;
                else
                    shouldDraw = true;

                if (!this.drawLinks)
                    shouldDraw = false;
                else
                    shouldDraw = true;

                if (!shouldDraw) {
                    linkLine.isVisible = false;
                    linkText.isVisible = false;
                    continue;
                } else {
                    linkLine.isVisible = true;
                    linkText.isVisible = true;
                }

                linkLine.x1 = clientDrone1Pos.x | 0;
                linkLine.y1 = clientDrone1Pos.y | 0;
                linkLine.x2 = clientDrone2Pos.x | 0;
                linkLine.y2 = clientDrone2Pos.y | 0;

                const TWEAK_LINE = 0;

                if (TWEAK_LINE) {
                    linkLine.x1 += i * 2 - nodes.length;
                    linkLine.y1 += j * 2 - nodes.length;
                    linkLine.x2 += i * 2 - nodes.length;
                    linkLine.y2 += j * 2 - nodes.length;
                }

                linkText.top = ((clientDrone1Pos.y + clientDrone2Pos.y) / 2) | 0;
                linkText.left = ((clientDrone1Pos.x + clientDrone2Pos.x) / 2) | 0;
                linkText.text = nodeDistance.toFixed(1);


                if (nodeDistance > 15) {
                    linkLine.isVisible = false;
                    linkText.isVisible = false;
                } else {
                    linkLine.isVisible = true;
                    linkText.isVisible = true;
                    if (nodeDistance < 10) {
                        linkLine.color = "green";
                        linkLine.alpha = 1.0;
                    } else if (nodeDistance < 13) {
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

    updateNodeInfo() {
        const targetNodeIdx = this.targetNodeIdx;
        if (targetNodeIdx < 0)
            return;
        const node: Node = this.nodeManager.nodeList[targetNodeIdx];

        this.nodeManager.drawNodePaths(targetNodeIdx);
        this.nodeInfo.text = "Node Index : " + targetNodeIdx + "\n";
        this.nodeInfo.text += "Tx Bytes : " + node.txBytes + " Rx Bytes : " + node.rxBytes + "\n";

        this.nodeInfo.text += "Routing Table\n";
        for (let i = 0; i < node.routingTable.length; i++) {
            if (node.routingTable[i].hopCount != 0) {
                let routeText = "";
                routeText += targetNodeIdx;
                for (let hop = 0; hop < node.routingTable[i].hopCount; hop++) {
                    routeText += " => " + node.routingTable[i].path[hop];
                }

                this.nodeInfo.text += routeText + "\n";
            }
        }

        if (node.guiInfoDirty) {
            node.guiInfoDirty = false;
            this.mainScene.dirty = true;
        }
    }

    onClickDroneButton(i: number) {
        this.nodeManager.disposePathMeshes();
        this.targetNodeIdx = i;
        this.updateNodeInfo();
        this.drawLinks = false;
    }

    updateDroneButtons() {
        const that = this;
        const nodes = this.nodeManager.nodeList;

        if (this.nodeGUIs.length < nodes.length) {
            for (let i = this.nodeGUIs.length; i < nodes.length; i++) {
                let droneGUI: NodeGUI = new Object() as NodeGUI;
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
                    that.onClickDroneButton(i);
                });

                this.advancedTexture.addControl(card);

                droneGUI.nameCard = card;

                this.nodeGUIs.push(droneGUI);
            }
        }

        for (let i = 0; i < nodes.length; i++) {
            const oneNode = nodes[i];
            const clientDronePos = this.mainScene.worldVec3toClient(oneNode.getPosition());
            if (Math.abs(clientDronePos.z) > 1.0) {
                this.nodeGUIs[i].nameCard.isVisible = false;
                continue;
            } else {
                this.nodeGUIs[i].nameCard.isVisible = true;
            }

            this.nodeGUIs[i].nameCard.left = ((clientDronePos.x | 0) - 20) + "px";
            this.nodeGUIs[i].nameCard.top = ((clientDronePos.y | 0) - 30) + "px";
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

        this.createMenuButton("Link", function () {
            that.drawLinks = !that.drawLinks;
            that.mainScene.dirty = true;
        });


    }
}