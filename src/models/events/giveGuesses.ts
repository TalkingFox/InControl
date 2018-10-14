import { Message, DataMessageType } from "./message";
import { Guess } from "../guess";

export class GiveGuesses implements Message<Guess[]> {
    public type: string = DataMessageType.GiveGuesses;
    public body: Guess[];

    constructor(guess: Guess[]) {
        this.body = guess;
    }
}