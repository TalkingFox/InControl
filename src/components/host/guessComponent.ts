import { Component } from "../component";
import { HostComponent } from "../hostComponent";
import { DrawingBoard } from "../../drawing-board";
import { DrawingBoardSettings } from "../../models/drawing-board-settings";
import { Guess } from "../../models/guess";
import { RoomState } from "../../models/events/stateChanged";
import { TalkativeArray } from "../../models/talkative-array";
import { Subject } from "rxjs";

export class GuessComponent extends Component {
    private drawingBoard: DrawingBoard;
    private guesses = new TalkativeArray<Guess>();
    private waitingOn: HTMLElement;
    private notGuessed: string[];

    constructor(private host: HostComponent) {
        super();
        const settings: DrawingBoardSettings = {
            elementId: 'guessDrawing',
            isReadOnly: true
        };
        this.drawingBoard = new DrawingBoard(settings);
        this.drawingBoard.loadDataUrl(host.drawingBoard.toDataUrl());
        this.waitingOn = document.getElementById('waitingOn');
    }

    public waitForGuesses(): Promise<Guess[]> {
        this.transitionTo('guessArea');
        this.notGuessed = this.host.room.users.slice(0);
        this.setWaitingOn();
        this.host.switchboard.guesses.subscribe((guess: Guess) => {
            this.guesses.Push(guess);
            this.notGuessed = this.notGuessed.filter(x => x !== guess.user);
            this.setWaitingOn();
        });
        this.host.switchboard.dispatchStateChange(RoomState.GiveGuesses);
        if (this.guesses.length === this.host.room.users.length) {
            const resolution = Promise.resolve(this.guesses.elements.splice(0));
            this.guesses.clear();
            return resolution;
        }
        const promise = new Subject<Guess[]>();
        const subscription = this.guesses.Subscribe(() => {
            if (this.guesses.length === this.host.room.users.length) {
                promise.next(this.guesses.clone());
                this.guesses.clear();
                promise.complete();
                subscription.unsubscribe();
            }
        });
        return promise.toPromise();
    }

    private setWaitingOn(): void {
        while(this.waitingOn.firstChild) {
            this.waitingOn.removeChild(this.waitingOn.firstChild);
        }
        this.notGuessed.forEach((person: string) => {
            const user: HTMLElement = document.createElement('li');
            user.textContent = person;
            this.waitingOn.appendChild(user);
        });
    }
}