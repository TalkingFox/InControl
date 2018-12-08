import { GuessScore } from '../guessScore';
import { DataMessageType, Message } from './message';

export class GuessesScored implements Message<GuessScore[]> {
    public type: string = DataMessageType.GuessesScored;
    public body: GuessScore[];

    constructor(guessScores: GuessScore[]) {
        this.body = guessScores;
    }
}
