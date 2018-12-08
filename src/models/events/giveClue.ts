import { DataMessageType, Message } from './message';

export class GiveClue implements Message<string> {
    public type: string = DataMessageType.GiveClue;
    public body: string;

    constructor(clue: string) {
        this.body = clue;
    }
}
