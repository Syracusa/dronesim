import { MainScene } from "./MainScene";
import * as GUI from "@babylonjs/gui/Legacy/legacy";

export class Panel {
    mainScene: MainScene;
    textblock: GUI.TextBlock;
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
    }

}