import { Guess } from "./guess";

export class GuessScore {
    public isLiked: boolean = false;
    public isFunny: boolean = false;
    public scoredBy: string;

    constructor(public guess: Guess){}
}