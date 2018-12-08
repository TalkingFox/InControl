import { Observable, Subject } from 'rxjs';
import { RoomState } from './events/stateChanged';
import { Question } from './question';

export class Room {
    public users: string[] = [];
    public cluelessUsers: string[];
    public usedClues: string[] = [];
    public question: Question;

    public roomState: Observable<RoomState>;

    public canvas: Observable<string>;
    private roomStateSubject: Subject<RoomState>;
    private canvasSubject: Subject<string>;

    constructor(public name: string) {
        this.roomStateSubject = new Subject<RoomState>();
        this.roomState = this.roomStateSubject.asObservable();

        this.canvasSubject = new Subject<string>();
        this.canvas = this.canvasSubject.asObservable();
    }

    public setRoomState(state: RoomState): void {
        this.roomStateSubject.next(state);
    }

    public setCanvasData(url: string): void {
        this.canvasSubject.next(url);
    }

    public reset(): void {
        this.usedClues = [];
        this.cluelessUsers = [];
    }
}
