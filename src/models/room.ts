import { Question } from "./question";

export class Room { 
    public users: string[] = [];
    public cluelessUsers: string[];
    public usedClues: string[] = [];
    public guessedUsers: string[] = [];
    public question: Question;
    constructor(public id, public name){}
}