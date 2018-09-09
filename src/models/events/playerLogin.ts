import { Message, DataMessageType } from "./message";
import { Player } from "../player";

export class PlayerLogin implements Message<Player> {
    public type: string = DataMessageType.UserLogin;

    constructor(public body: Player){}
}