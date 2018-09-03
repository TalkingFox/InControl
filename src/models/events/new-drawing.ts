import { DataMessageType, Message } from "./message";

export class NewDrawing implements Message<string> {
    public type: string = DataMessageType.NewDrawing;
    public body: string;

    constructor(dataUrl: string) {
        this.body = dataUrl;
    }
}