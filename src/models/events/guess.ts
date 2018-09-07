import { DataMessageType, Message } from "./message";

export class SendGuess implements Message<Guess> {
    public type: string = DataMessageType.Guess;
    public body: Guess;

    constructor(user: string, guess: string) {
        this.body = new Guess(user, guess);
    }
}

export class Guess {
    constructor(public user: string, public guess: string){}
}