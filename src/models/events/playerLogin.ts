import { Player } from '../player';
import { DataMessageType, Message } from './message';

export class PlayerLogin implements Message<Player> {
    public type: string = DataMessageType.UserLogin;

    constructor(public body: Player) {}
}
