
console.log('analyzer started');

let workerConnected = false;

function handleWorkerMessage(data: any) {
    if (data.hasOwnProperty("type")) {
        switch (data.type) {
            case "TcpOnConnect":
                console.log("TCP connected");
                break;
            case "TRx":
                // console.log(data);
                break;
            case "Status":
                // console.log(data);
                break;
            case "Route":
                // console.log(data);
                break;
            default:
                console.log("Unknown message type from worker " + data.type);
                break;
        }
    }
}

window.electronAPI.requestWorkerChannel((data: any) => {
    workerConnected = true;
    handleWorkerMessage(data);
});
