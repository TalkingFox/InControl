import { DataMessageType, Message } from './message';

export class DrawingUpdate implements Message<string> {
    public type: string = DataMessageType.DrawingUpdate;
    public body: string;

    constructor(dataUrl: string) {
        this.body = dataUrl;
    }
}
