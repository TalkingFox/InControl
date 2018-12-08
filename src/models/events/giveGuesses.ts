import { Guess } from '../event-bodies/guess';
import { DataMessageType, Message } from './message';

export class GiveGuesses implements Message<Guess[]> {
    public type: string = DataMessageType.GiveGuesses;
    public body: Guess[];

    constructor(guess: Guess[]) {
        this.body = guess;
    }
}
