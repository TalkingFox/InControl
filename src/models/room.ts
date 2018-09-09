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

    public canvas: Observable<string>;
    private canvasSubject: Subject<string>;

    constructor(public id, public name){
        this.roomStateSubject = new Subject<RoomState>();
        this.roomState = this.roomStateSubject.asObservable();

        this.canvasSubject = new Subject<string>();
        this.canvas = this.canvasSubject.asObservable();
    }

    public setRoomState(state: RoomState) {
        this.roomStateSubject.next(state);
    }

    public setCanvasData(url: string) {
        this.canvasSubject.next(url);
    }
}