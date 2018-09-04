import { DataMessageType, Message } from "./message";

export class UserSelected implements Message<string> {
    public type: string = DataMessageType.UserSelected;
    public body: string;

    constructor(user: string) {
        this.body = user;
    }
}