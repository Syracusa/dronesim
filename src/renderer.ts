
import { MainScene } from './scene/MainScene';
import './index.css';
declare global {
    interface Window {
        electronAPI:any;
    }
}

let workerConnected = false;

window.electronAPI.requestWorkerChannel((data: any) => {
    workerConnected = true;
});

async function waitWorkerConnection() {
    while (!workerConnected) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log("worker connected");
    new MainScene();
}

waitWorkerConnection();
