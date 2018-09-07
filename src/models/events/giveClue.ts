import { Message, DataMessageType } from "./message";

export class GiveClue implements Message<ClueEnvelope> {
    public type: string = DataMessageType.GiveClue;
    public body: ClueEnvelope;

    constructor(user: string, clue: string) {
        this.body = new ClueEnvelope(user, clue);
    }
}

export class ClueEnvelope{
    constructor(public player: string, public clue: string){}
}