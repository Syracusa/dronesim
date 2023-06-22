import { MainScene } from "./MainScene";
import * as GUI from "@babylonjs/gui/Legacy/legacy";

export class Panel {
    mainScene: MainScene;

    constructor(mainScene: MainScene) {
        this.mainScene = mainScene;
        this.makePanel();
    }

    makePanel() {
        let advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        
        // Style
        let style = advancedTexture.createStyle();
        style.fontSize = 3;
        style.fontStyle = "bold";
    
        // Panel
        let panel = new GUI.StackPanel();   
        panel.left = "-45%";
        panel.isVertical = true; 
        advancedTexture.addControl(panel);   
    
        let text1 = new GUI.TextBlock();

        text1.text = "Hello world (no style)";
        text1.color = "white";
        text1.height = "30px";
        text1.fontSize = 5;
        text1.fontStyle = "bold";
        panel.addControl(text1);     
    }
    
}