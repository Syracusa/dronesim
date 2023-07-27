import { NodeManager, Node } from "./NodeManager";
import { MainScene } from "./MainScene";
import * as GUI from "@babylonjs/gui/legacy/legacy";
import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { Scenario } from "./Scenario";

interface NodeLink {
    linkLine: GUI.Line;
    linkText: GUI.TextBlock;
}

interface NodeGUI {
    nameCard: GUI.Button;
    links: NodeLink[];
}

export class GuiLayer {
    /* GUIs */
    private readonly advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    private nodeGUIs: NodeGUI[] = [];
    private menuButtons: GUI.Button[] = [];

    private infoPanel: GUI.TextBlock;
    private nodeInfo: GUI.TextBlock;
    private dragIndicator: GUI.Rectangle;

    /* Update Interval */
    private readonly useUpdateInterval: boolean = true;
    private readonly updateIntervalMs: number = 20;
    private lastUpdate = 0;

    /* ETC */
    private menuButtonOffset = 12;
    private menuOpened = true;
    private drawLinks = true;
    private targetNodeIdx = -1;

    constructor(
        private readonly mainScene: MainScene,
        private readonly nodeManager: NodeManager,
        private readonly scenario: Scenario) {

        this.makeControls();
        this.backgroundWork();
    }

    private backgroundWork() {
        this.updateNodeInfo();
        setTimeout(() => {
            this.backgroundWork();
        }, 1000);
    }

    public update() {
        if (this.useUpdateInterval) {
            if (performance.now() - this.lastUpdate < this.updateIntervalMs)
                return;
            this.lastUpdate = performance.now();
        }

        this.updatePanelText();
        this.updateDroneButtons();
        this.updateDroneLinkLines();
    }

    private createNewLink() {
        const link = new Object() as NodeLink;
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

        return link;
    }

    private updateLink(linkLine: GUI.Line, linkText: GUI.TextBlock,
        clipos1: BABYLON.Vector3,
        clipos2: BABYLON.Vector3,
        distance: number) {

        linkLine.x1 = clipos1.x | 0;
        linkLine.y1 = clipos1.y | 0;
        linkLine.x2 = clipos2.x | 0;
        linkLine.y2 = clipos2.y | 0;

        linkText.top = ((clipos1.y + clipos2.y) / 2) | 0;
        linkText.left = ((clipos1.x + clipos2.x) / 2) | 0;
        linkText.text = distance.toFixed(1);

        if (distance < 10) {
            linkLine.color = "green";
            linkLine.alpha = 1.0;
        } else if (distance < 13) {
            linkLine.color = "yellow";
            linkLine.alpha = 0.5;
        } else {
            linkLine.color = "red";
            linkLine.alpha = 0.7;
        }
    }

    private updateOneDroneLinkLine(nodeidx1: number, nodeidx2: number) {
        const nodes = this.nodeManager.nodeList;
        const node1 = nodes[nodeidx1];
        const node2 = nodes[nodeidx2];
        const clientDrone1Pos = this.mainScene.worldVec3toClient(node1.getPosition());
        const clientDrone2Pos = this.mainScene.worldVec3toClient(node2.getPosition());

        const nodeDistance = BABYLON.Vector3.Distance(node1.getPosition(), node2.getPosition());

        const linkLine = this.nodeGUIs[nodeidx1].links[nodeidx2 - nodeidx1 - 1].linkLine;
        const linkText = this.nodeGUIs[nodeidx1].links[nodeidx2 - nodeidx1 - 1].linkText;

        if (Math.abs(clientDrone1Pos.z) > 1.0 ||
            Math.abs(clientDrone2Pos.z) > 1.0 ||
            !this.drawLinks || nodeDistance > 15) {

            linkLine.isVisible = false;
            linkText.isVisible = false;
            return;
        } else {
            linkLine.isVisible = true;
            linkText.isVisible = true;
        }

        this.updateLink(linkLine, linkText, clientDrone1Pos, clientDrone2Pos, nodeDistance);
    }

    private updateDroneLinkLines() {
        const nodes = this.nodeManager.nodeList;
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                if (this.nodeGUIs[i].links.length < j - i) {
                    for (let k = this.nodeGUIs[i].links.length; k < j - i; k++) {
                        this.nodeGUIs[i].links.push(this.createNewLink());
                    }
                }
                this.updateOneDroneLinkLine(i, j);
            }
        }
    }

    private updateNodeInfo() {
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
                let routeText = "" + targetNodeIdx;
                for (let hop = 0; hop < node.routingTable[i].hopCount; hop++)
                    routeText += " => " + node.routingTable[i].path[hop];
                this.nodeInfo.text += routeText + "\n";
            }
        }

        if (node.guiInfoDirty) {
            node.guiInfoDirty = false;
            this.mainScene.dirty = true;
        }
    }

    private onClickDroneButton(i: number) {
        this.nodeManager.disposePathMeshes();
        this.targetNodeIdx = i;
        this.updateNodeInfo();
        this.drawLinks = false;
    }

    private createNewDroneButton(buttonIdx: number) {
        const card = GUI.Button.CreateSimpleButton("but " + buttonIdx, "Drone " + buttonIdx);
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
        card.onPointerUpObservable.add(() => { this.onClickDroneButton(buttonIdx); });

        this.advancedTexture.addControl(card);
        this.nodeGUIs.push({nameCard: card, links: []});
    }

    private createNewDroneButtonsIfNeeded() {
        const nodes = this.nodeManager.nodeList;

        if (this.nodeGUIs.length < nodes.length) {
            for (let i = this.nodeGUIs.length; i < nodes.length; i++) {
                this.createNewDroneButton(i);
            }
        }
    }

    private updateDroneButtons() {
        this.createNewDroneButtonsIfNeeded();

        const nodes = this.nodeManager.nodeList;
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

    private updatePanelText() {
        let text = "";
        text += "FPS: " + this.mainScene.engine.getFps().toFixed() + "\n";
        text += "Pointer: "
            + this.mainScene.scene.pointerX + " " + this.mainScene.scene.pointerY + "\n";
        this.infoPanel.text = text;
    }

    private menuViewToggleButtonClicked() {
        this.menuOpened = !this.menuOpened;
        for (let i = 0; i < this.menuButtons.length; i++)
            this.menuButtons[i].isVisible = this.menuOpened;
        this.mainScene.dirty = true;
    }

    private createMenuButton(name: string, callback: () => void) {
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
        sceneSaveButton.onPointerUpObservable.add(() => {
            callback();
        });

        this.advancedTexture.addControl(sceneSaveButton);
        this.menuButtons.push(sceneSaveButton);
        this.menuButtonOffset += 12;
    }

    private createInfoPanel() {
        const infoPanel = new GUI.TextBlock();
        infoPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        infoPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        infoPanel.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        infoPanel.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        infoPanel.text = "N/A";
        infoPanel.color = "white";
        infoPanel.height = "300px";
        infoPanel.fontSize = 10;
        this.advancedTexture.addControl(infoPanel);
        this.infoPanel = infoPanel;
    }

    private createNodeInfoPanel() {
        const nodeInfo = new GUI.TextBlock();
        nodeInfo.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        nodeInfo.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        nodeInfo.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        nodeInfo.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        nodeInfo.text = "No node selected";
        nodeInfo.color = "white";
        nodeInfo.resizeToFit = true;
        nodeInfo.fontSize = 10;
        this.advancedTexture.addControl(nodeInfo);
        this.nodeInfo = nodeInfo;
    }

    private createDragIndicator() {
        const dragIndicator = new GUI.Rectangle();
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
        this.advancedTexture.addControl(dragIndicator);
        this.dragIndicator = dragIndicator;
    }

    private createMenuViewToggleButton() {
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
        menuViewToggleButton.onPointerUpObservable.add(() => {
            this.menuViewToggleButtonClicked();
        });

        this.advancedTexture.addControl(menuViewToggleButton);
    }

    private makeControls() {
        this.createInfoPanel();
        this.createNodeInfoPanel();
        this.createDragIndicator();
        this.createMenuViewToggleButton();

        this.createMenuButton("Start", () => { this.scenario.start(); });
        this.createMenuButton("Pause", () => { this.scenario.pause(); });
        this.createMenuButton("Resume", () => { this.scenario.resume(); });
        this.createMenuButton("Link", () => {
            this.drawLinks = !this.drawLinks;
            this.updateDroneLinkLines();
            this.mainScene.dirty = true;
        });
        this.createMenuButton("Save", () => { this.mainScene.saveScene(); });
        this.createMenuButton("Load", () => { this.mainScene.loadScene(); });
    }

    public updateDragIndicator(x1: number, y1: number, x2: number, y2: number) {
        if (x1 > x2)
            [x1, x2] = [x2, x1];

        if (y1 > y2)
            [y1, y2] = [y2, y1];
            
        const dragIndicator = this.dragIndicator;
        dragIndicator.left = x1 + "px";
        dragIndicator.top = y1 + "px";
        dragIndicator.width = (x2 - x1) + "px";
        dragIndicator.height = (y2 - y1) + "px";
    }

}