import { Component } from '../../core/component';
import { DrawingBoard } from '../../core/drawing/drawingBoard';
import { Util } from '../../core/util';
import { ClueEnvelope } from '../../models/ClueEnvelope';
import { Guess } from '../../models/event-bodies/guess';
import { GuessScore } from '../../models/guessScore';
import { Question } from '../../models/question';
import { Room } from '../../models/room';
import { QuestionService } from '../services/questionService';
import { Switchboard } from '../switchboard';
import { AnswerComponent } from './answerComponent';
import { DrawingComponent } from './drawingComponent';
import { GuessComponent } from './guessComponent';

export class HostComponent extends Component {
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

    public room: Room;
    public drawingBoard: DrawingBoard;
    public switchboard: Switchboard;
    private tagline: HTMLElement;
    private turnMessage: HTMLElement;
    private questions: QuestionService;
    private drawingComponent: DrawingComponent;
    private answerComponent: AnswerComponent;
    private reallyPlayAgain: HTMLElement;

    constructor() {
        super();
        this.tagline = document.getElementById('tagline');
        this.turnMessage = document.getElementById('turnMessage');
        this.drawingBoard = new DrawingBoard({
            elementId: 'drawingBoard',
            isReadOnly: true
        });
        this.switchboard = new Switchboard();
        this.questions = new QuestionService();
        this.drawingComponent = new DrawingComponent(this);
        this.answerComponent = new AnswerComponent(this);
        this.reallyPlayAgain = document.getElementById('reallyPlayAgain');
    }

    public initialize(): void {
        this.switchboard.drawingUpdates.subscribe((dataUrl: string) => {
            this.drawingBoard.loadDataUrl(dataUrl);
        });

        this.reallyPlayAgain.addEventListener('click', () => {
            this.questions.reset();
            this.startGame();
        });
    }

    public startGame(): void {
        this.resetBoard();
        this.switchboard.stopAcceptingNewUsers();
        this.questions.take().then((question: Question) => {
            if (!question) {
                this.transitionTo('outOfQuestions');
                return;
            }
            this.room.question = question;
            this.room.cluelessUsers = this.room.users.slice();
            this.takeClues().map((envelope: ClueEnvelope) => {
                this.switchboard.dispatchMessage(
                    envelope.player,
                    envelope.clue
                );
            });
            this.startNextRound();
        });
    }

    public endGame(): void {
        const guessComponent = new GuessComponent(this);
        guessComponent
            .waitForGuesses()
            .then((finalGuesses: Guess[]) =>
                guessComponent.waitForScores(finalGuesses)
            )
            .then((newlyScoredGuesses: GuessScore[]) =>
                this.answerComponent.initialize(newlyScoredGuesses)
            );
    }

    public startNextRound(): void {
        if (this.room.cluelessUsers.length === 0) {
            return this.endGame();
        }
        this.drawingComponent.initialize();
    }

    private resetBoard(): void {
        this.IsTaglineGlowing = false;
        this.IsTurnMessageHidden = false;
        this.drawingBoard.ClearCanvas();
        this.room.reset();
    }

    private takeClues(): ClueEnvelope[] {
        const clues = this.room.users.map((user: string) => {
            const clue = Util.PopRandomElement(this.room.question.clues);
            this.room.usedClues.push(clue);
            return new ClueEnvelope(user, clue);
        });
        return clues;
    }
}
