import { Subject, Subscription } from 'rxjs';
import { DrawingBoard } from '../../drawing-board';
import { DrawingBoardSettings } from '../../models/drawing-board-settings';
import { Guess } from '../../models/event-bodies/guess';
import { GiveGuesses } from '../../models/events/giveGuesses';
import { RoomState } from '../../models/events/stateChanged';
import { GuessScore } from '../../models/guessScore';
import { TalkativeArray } from '../../models/talkative-array';
import { Util } from '../../util';
import { Component } from '../component';
import { HostComponent } from './hostComponent';

export class GuessComponent extends Component {
    private drawingBoard: DrawingBoard;
    private guesses: TalkativeArray<Guess>;
    private scoredGuesses: TalkativeArray<GuessScore[]>;
    private waitingOn: HTMLElement;
    private notGuessed: string[];

    private subs: Subscription;

    constructor(private host: HostComponent) {
        super();
        const settings: DrawingBoardSettings = {
            elementId: 'guessDrawing',
            isReadOnly: true,
        };
        this.drawingBoard = new DrawingBoard(settings);
        this.drawingBoard.loadDataUrl(host.drawingBoard.toDataUrl());
        this.waitingOn = document.getElementById('waitingOn');
        this.guesses = new TalkativeArray<Guess>();
        this.scoredGuesses = new TalkativeArray<GuessScore[]>();
        this.subs = this.host.switchboard.guesses.subscribe((guess: Guess) => {
            this.guesses.Push(guess);
            this.notGuessed = this.notGuessed.filter((x) => x !== guess.user);
            this.setWaitingOn();
        });

        this.subs.add(this.host.switchboard.scoredGuesses.subscribe((scores: GuessScore[]) => {
            this.scoredGuesses.Push(scores);
            this.notGuessed = this.notGuessed.filter((x) => x !== scores[0].scoredBy);
            this.setWaitingOn();
        }));
    }

    private set tagline(value: string) {
        const tagElement = document.getElementById('guessText');
        tagElement.textContent = value;
    }

    public waitForGuesses(): Promise<Guess[]> {
        this.tagline = 'Submit Your Guesses!';
        this.transitionTo('guessArea');
        this.notGuessed = this.host.room.users.slice(0);
        this.setWaitingOn();
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

    public waitForScores(finalGuesses: Guess[]): Promise<GuessScore[]> {
        this.tagline = 'Waiting for Your Scores!';
        this.notGuessed = this.host.room.users.slice(0);
        this.setWaitingOn();
        const guessesMessage = new GiveGuesses(finalGuesses);
        this.host.switchboard.dispatchMessageToAll(guessesMessage);

        if (this.scoredGuesses.length === this.host.room.users.length) {
            const flattenedGuesses = this.scoredGuesses.elements.reduce((a, b) => {
                return a.concat(b);
            });
            const resolution = Promise.resolve(flattenedGuesses.splice(0));
            this.scoredGuesses.clear();
            return resolution;
        }

        const promise = new Subject<GuessScore[]>();
        const subscription = this.scoredGuesses.Subscribe(() => {
            if (this.scoredGuesses.length === this.host.room.users.length) {
                const flattenedGuesses = this.scoredGuesses.elements.reduce((a, b) => {
                    return a.concat(b);
                });
                promise.next(flattenedGuesses.splice(0));
                this.scoredGuesses.clear();
                promise.complete();
                subscription.unsubscribe();
            }
        });
        return promise.toPromise();
    }

    private setWaitingOn(): void {
        Util.ClearElement(this.waitingOn);
        this.notGuessed.forEach((person: string) => {
            const user: HTMLElement = document.createElement('li');
            user.textContent = person;
            this.waitingOn.appendChild(user);
        });
    }
}
