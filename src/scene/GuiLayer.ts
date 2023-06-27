import { MainScene } from "./MainScene";
import * as GUI from "@babylonjs/gui/Legacy/legacy";

export class GuiLayer {
    mainScene: MainScene;
    textblock: GUI.TextBlock;
    dragIndicator: GUI.Rectangle;
    updateIntervalMs = 100;

    constructor(mainScene: MainScene) {
        this.mainScene = mainScene;
        this.makePanel();
    }

    updatePanelText() {
        let text = "";
        text += "FPS: " + this.mainScene.engine.getFps().toFixed() + "\n";
        text += "Pointer: "
            + this.mainScene.scene.pointerX + " " + this.mainScene.scene.pointerY + "\n";
        this.textblock.text = text;
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

        // Panel
        let panel = new GUI.StackPanel();
        panel.left = "0%";
        panel.top = "0%";
        panel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        panel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        panel.isVertical = true;
        advancedTexture.addControl(panel);

        let text1 = new GUI.TextBlock();
        text1.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        text1.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        text1.text = "N/A";
        text1.color = "white";
        text1.height = "300px";
        text1.fontSize = 10;
        panel.addControl(text1);

        this.textblock = text1;

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
    }
}