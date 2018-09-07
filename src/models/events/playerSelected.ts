import { DataMessageType, Message } from "./message";

export class PlayerSelected implements Message<string> {
    public type: string = DataMessageType.PlayerSelected;
    public body: string;

    constructor(user: string) {
        this.body = user;
    }
}