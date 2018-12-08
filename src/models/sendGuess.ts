import { Guess } from './event-bodies/guess';
import { DataMessageType, Message } from './events/message';

export class SendGuess implements Message<Guess> {
    public type: string = DataMessageType.Guess;
    public body: Guess;

    constructor(user: string, guess: string) {
        this.body = new Guess(user, guess);
    }
}
