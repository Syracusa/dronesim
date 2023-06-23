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
        this.textblock.text = "FPS: " + this.mainScene.engine.getFps().toFixed();
    }

    makePanel() {
        let advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        
        // Style
        let style = advancedTexture.createStyle();
        style.fontSize = 3;
        style.fontStyle = "bold";
    
        // Panel
        let panel = new GUI.StackPanel();   
        panel.left = "-40%";
        panel.isVertical = true; 
        advancedTexture.addControl(panel);   
    
        let text1 = new GUI.TextBlock();

        text1.text = "Hello world (no style)";
        text1.color = "white";
        text1.height = "30px";
        text1.fontSize = 10;
        text1.fontStyle = "bold";
        panel.addControl(text1);     

        this.textblock = text1;
    }
    
}