import { Guess } from './event-bodies/guess';

export class GuessScoreCard {
    public likes: number = 0;
    public funnies: number = 0;

    constructor(public guess: Guess) {}
}
