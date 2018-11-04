import { DrawingBoard } from "../drawing-board";
import { Switchboard } from "../telephony/switchboard";
import { QuestionService } from "../telephony/questionService";
import { Question } from "../models/question";
import { Room } from "../models/room";
import { Component } from "./component";
import { ClueEnvelope } from "../models/ClueEnvelope";
import { Util } from "../util";
import { Guess } from "../models/guess";
import { RoomState } from "../models/events/stateChanged";
import { DrawingComponent } from "./drawingComponent";
import { GuessScore } from "../models/guessScore";
import { AnswerComponent } from "./answerComponent";
import { GiveGuesses } from "../models/events/giveGuesses";
import { TalkativeArray } from "../models/talkative-array";
import { Subject } from "rxjs";

export class HostComponent extends Component{
    private tagline: HTMLElement;
    private turnMessage: HTMLElement;
    private questions: QuestionService;
    private drawingComponent: DrawingComponent;
    private answerComponent: AnswerComponent;
    private scoredGuesses: TalkativeArray<GuessScore[]>;
    private guesses: TalkativeArray<Guess>;
    
    public room: Room;
    public drawingBoard: DrawingBoard;
    public switchboard: Switchboard;

    constructor() {
        super();
        this.tagline = document.getElementById('tagline');
        this.turnMessage = document.getElementById('turnMessage');
        this.drawingBoard = new DrawingBoard({ elementId: 'drawingBoard', isReadOnly: true });
        this.switchboard = new Switchboard();
        this.questions = new QuestionService();
        this.drawingComponent = new DrawingComponent(this);
        this.scoredGuesses = new TalkativeArray<GuessScore[]>();
        this.answerComponent = new AnswerComponent(this);
        this.guesses = new TalkativeArray<Guess>();
    }

    public initialize() {
        this.switchboard.drawingUpdates.subscribe((dataUrl: string) => {
            this.drawingBoard.loadDataUrl(dataUrl);
        });
        this.switchboard.guesses.subscribe((guess: Guess) => this.guesses.Push(guess));
        this.switchboard.scoredGuesses.subscribe((scores: GuessScore[]) => {
            this.scoredGuesses.Push(scores);
        });
    }

    public startGame() {
        this.switchboard.stopAcceptingNewUsers();
        this.questions.take().then((question: Question) => {
            if (!question) {
                this.transitionTo('outOfQuestions');
                return;
            }
            this.room.question = question;
            this.room.cluelessUsers = this.room.users.slice();
            this.takeClues().map((envelope: ClueEnvelope) => {
                this.switchboard.dispatchMessage(envelope.player, envelope.clue);
            });
            this.startNextRound();
        });
    }

    public endGame() {
        this.waitForGuesses()
        .then((finalGuesses: Guess[]) => this.waitForScores(finalGuesses))
        .then((newlyScoredGuesses: GuessScore[]) => this.answerComponent.initialize(newlyScoredGuesses));
    }

    private waitForScores(finalGuesses: Guess[]): Promise<GuessScore[]> {
        this.Tagline = 'Waiting for Your Scores!'
        const guessesMessage = new GiveGuesses(finalGuesses);
        this.switchboard.dispatchMessageToAll(guessesMessage);
        
        if (this.scoredGuesses.length === this.room.users.length) {
            const flattenedGuesses = this.scoredGuesses.elements.reduce((a,b) => {
                return a.concat(b);
            });
            const resolution = Promise.resolve(flattenedGuesses.splice(0));
            this.scoredGuesses.clear();
            return resolution;
        }
    
        const promise = new Subject<GuessScore[]>();
        const subscription = this.scoredGuesses.Subscribe(() => {
            console.log('checking for shit');
            if (this.scoredGuesses.length === this.room.users.length) {
                console.log('hey, we got "em all');
                console.log('before flattening', JSON.stringify(this.scoredGuesses.elements));
                const flattenedGuesses = this.scoredGuesses.elements.reduce((a,b) => {
                    return a.concat(b);
                });
                console.log('flattened', JSON.stringify(flattenedGuesses));
                promise.next(flattenedGuesses.splice(0));
                this.scoredGuesses.clear();
                promise.complete();
                console.log('promise completed')
    
                subscription.unsubscribe();
            }
        });
        return promise.toPromise();
    }

    private waitForGuesses(): Promise<Guess[]> {
        this.switchboard.dispatchStateChange(RoomState.GiveGuesses);
        this.Tagline = "Submit Your Guesses!";
        this.IsTaglineGlowing = true;
        this.IsTurnMessageHidden = true;
    
        if (this.guesses.length === this.room.users.length) {
            const resolution = Promise.resolve(this.guesses.elements.splice(0));
            this.guesses.clear();
            return resolution;
        }
        const promise = new Subject<Guess[]>();
        const subscription = this.guesses.Subscribe(() => {
            if (this.guesses.length === this.room.users.length) {
                promise.next(this.guesses.clone());
                this.guesses.clear();
                promise.complete();
                subscription.unsubscribe();
            }
        });
        return promise.toPromise();
    }

    private takeClues(): ClueEnvelope[] {
        const clues = this.room.users.map((user: string) => {
            const clue = Util.PopRandomElement(this.room.question.clues);
            this.room.usedClues.push(clue);
            return new ClueEnvelope(user, clue);
        });	
        return clues;
    }

    public startNextRound(): void {
        if (this.room.cluelessUsers.length === 0) {
            return this.endGame();
        }
        this.drawingComponent.initialize();        
    }

    public set Tagline(value: string) {
        this.tagline.textContent = value;
    }

    public set IsTaglineGlowing(value: boolean) {
        if (value) {
            this.tagline.classList.add('glow');
        } else {
            this.tagline.classList.remove('glow');
        }
    }

    public set IsTurnMessageHidden(value: boolean) {
        if (value) {
            this.turnMessage.classList.add('hidden');
        } else {
            this.turnMessage.classList.remove('hidden');
        }
    }
}