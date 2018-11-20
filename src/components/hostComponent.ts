import { DrawingBoard } from "../drawing-board";
import { Switchboard } from "../telephony/switchboard";
import { QuestionService } from "../telephony/questionService";
import { Question } from "../models/question";
import { Room } from "../models/room";
import { Component } from "./component";
import { ClueEnvelope } from "../models/ClueEnvelope";
import { Util } from "../util";
import { Guess } from "../models/guess";
import { DrawingComponent } from "./drawingComponent";
import { GuessScore } from "../models/guessScore";
import { AnswerComponent } from "./answerComponent";
import { TalkativeArray } from "../models/talkative-array";
import { GuessComponent } from "./host/guessComponent";

export class HostComponent extends Component{
    private tagline: HTMLElement;
    private turnMessage: HTMLElement;
    private questions: QuestionService;
    private drawingComponent: DrawingComponent;
    private answerComponent: AnswerComponent;
    private reallyPlayAgain: HTMLElement;
    
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
        this.answerComponent = new AnswerComponent(this);
        this.reallyPlayAgain = document.getElementById('reallyPlayAgain');
    }

    public initialize() {
        this.switchboard.drawingUpdates.subscribe((dataUrl: string) => {
            this.drawingBoard.loadDataUrl(dataUrl);
        });
        
        this.reallyPlayAgain.addEventListener('click', () => {
            this.questions.reset();
            this.startGame();
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
        const guessComponent = new GuessComponent(this);
        guessComponent.waitForGuesses()
            .then((finalGuesses: Guess[]) => guessComponent.waitForScores(finalGuesses))
            .then((newlyScoredGuesses: GuessScore[]) => this.answerComponent.initialize(newlyScoredGuesses));
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