
import { MainScene } from './scene/MainScene';
import './index.css';
declare global {
    interface Window {
        electronAPI:any;
    }
}

new MainScene();