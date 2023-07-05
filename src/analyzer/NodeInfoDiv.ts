
export class NodeInfoDiv {
    domElem: HTMLDivElement;
    idx: number;
    txbytes: number;
    rxbytes: number;

    childHeader: HTMLHeadingElement;
    childBody: HTMLDivElement;

    constructor(idx: number) {
        this.idx = idx;
        this.domElem = document.createElement("div");

        const headerElem = document.createElement("h3");
        headerElem.innerText = 'Node ' + idx;
        this.childHeader = headerElem;
        this.domElem.appendChild(headerElem);

        const childBody = document.createElement("div");
        this.childBody = childBody;
        this.domElem.appendChild(childBody);
    }

    attachTo(parent: HTMLElement) {
        parent.appendChild(this.domElem);
    }

    setText(text: string) {
        this.childBody.innerText = text;
    }

    updateText(){
        let text = '';
        // text += 'idx : ' + this.idx + '\n';
        text += 'tx : ' + this.txbytes + '\n';
        text += 'rx : ' + this.rxbytes + '\n';
        this.setText(text);
    }
}

