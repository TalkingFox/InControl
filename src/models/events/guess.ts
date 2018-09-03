import { DataMessageType, Message } from "./message";

export class Guess implements Message<string> {
    public type: string = DataMessageType.Guess;
    public body: string;

    constructor(guess: string) {
        this.body = guess.trim();
    }
}