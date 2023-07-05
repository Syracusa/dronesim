
export class NodeInfoDiv {
    domElem: HTMLDivElement;

    constructor() {
        this.domElem = document.createElement("div");
        this.domElem.innerText = " test ";
    }

    attachTo(parent: HTMLElement) {
        parent.appendChild(this.domElem);
    }
}

