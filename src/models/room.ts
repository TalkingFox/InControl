import { Question } from "./question";
import { Observable, Subject } from "rxjs";
import { RoomState } from "./events/stateChanged";

export class Room { 
    public users: string[] = [];
    public cluelessUsers: string[];
    public usedClues: string[] = [];
    public guessedUsers: string[] = [];
    public question: Question;

    public roomState: Observable<RoomState>;
    private roomStateSubject: Subject<RoomState>;

    constructor(public id, public name){
        this.roomStateSubject = new Subject<RoomState>();
        this.roomState = this.roomStateSubject.asObservable();
    }

    public setRoomState(state: RoomState) {
        this.roomStateSubject.next(state);
    }
}