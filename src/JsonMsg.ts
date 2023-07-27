export interface TRxMsg {
    node: number;
    tx: number;
    rx: number;
}

export interface RouteMsg {
    node: number;
    target: number;
    hopcount: number;
    path: number[];
}
