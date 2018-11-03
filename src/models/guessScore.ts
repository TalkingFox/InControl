import { Guess } from "./guess";

export class GuessScore {
    public isLiked: boolean = false;
    public isFunny: boolean = false;

    constructor(public guess: Guess){}
}