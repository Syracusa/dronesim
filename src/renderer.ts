
import { MainScene } from './scene/MainScene';
import './index.css';
declare global {
    interface Window {
        electronAPI:any;
    }
}

window.electronAPI.requestWorkerChannel((data: any) => {
    return 'Hello from renderer';
});

new MainScene();