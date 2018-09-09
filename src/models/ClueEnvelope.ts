import { GiveClue } from "./events/giveClue";

export class ClueEnvelope{
    public clue: GiveClue;
    constructor(public player: string, clue: string){
        this.clue = new GiveClue(clue);
    }
}