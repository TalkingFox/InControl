import { PlayerState } from '../event-bodies/playerState';
import { DataMessageType, Message } from './message';

export class PlayerSelected implements Message<PlayerState> {
    public type: string = DataMessageType.PlayerSelected;
    public body: PlayerState;

    constructor(player: string, canvasUrl: string) {
        this.body = new PlayerState(player, canvasUrl);
    }
}
