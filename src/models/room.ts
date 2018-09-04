import { Question } from "./question";

export class Room { 
    public users: string[] = [];
    public question: Question;
    constructor(public id, public name){}
}