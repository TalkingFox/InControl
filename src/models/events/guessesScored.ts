import { Message, DataMessageType } from "./message";
import { GuessScore } from "../guessScore";

export class GuessesScored implements Message<GuessScore[]>{
    public type: string = DataMessageType.GuessesScored;
    public body: GuessScore[];

    constructor(guessScores: GuessScore[]) {
        this.body = guessScores;
    }
}