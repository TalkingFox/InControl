import { HostComponent } from "./hostComponent";
import { GuessScore } from "../models/guessScore";
import { GuessScoreCard } from "../models/guessScoreCard";
import { Component } from "./component";

export class AnswerComponent extends Component {

    private finalDrawing: HTMLImageElement;

    constructor(private host: HostComponent) {
        super();
        const replay = document.getElementById('replay');
        replay.addEventListener('click', () => {
            host.IsTaglineGlowing = false;
            host.IsTurnMessageHidden = false;
            host.drawingBoard.ClearCanvas();
            host.startGame();
        });
        replay.addEventListener('click', () => {
            host.startGame();
        });

        this.finalDrawing = document.getElementById('finalDrawing') as HTMLImageElement;
    }

    public initialize(scoredGuesses: GuessScore[]): void {
        const finalGuesses = new Map<string, GuessScoreCard>();
        scoredGuesses.map((guessScore: GuessScore) => {
            if (!finalGuesses.has(guessScore.guess.user)) {
                const newCard = new GuessScoreCard(guessScore.guess);
                finalGuesses.set(guessScore.guess.user, newCard);
            }

            const card = finalGuesses.get(guessScore.guess.user);
            if (guessScore.isFunny) {
                card.funnies++;
            }
            if (guessScore.isLiked) {
                card.likes++;
            }
        });
        const guessesList = document.getElementById('guesses');
        finalGuesses.forEach((scoreCard: GuessScoreCard) => {
            const span = document.createElement('span');
            span.classList.add('clueScore');

            const guessElement = document.createElement('p');
            guessElement.textContent = `${scoreCard.guess.user} said: ${scoreCard.guess.guess}`;

            const likesElement = document.createElement('p');
            likesElement.classList.add('likes');
            likesElement.textContent = scoreCard.likes.toString();

            const funnyElement = document.createElement('p');
            funnyElement.classList.add('funny');
            funnyElement.textContent = scoreCard.funnies.toString();

            span.appendChild(guessElement);
            span.appendChild(likesElement);
            span.appendChild(funnyElement);
            guessesList.appendChild(span);
        });
        const cluesList = document.getElementById('clues');
        this.host.room.usedClues.map((clue: string) => {
            const clueElement = document.createElement('p');
            clueElement.textContent = clue;
            cluesList.appendChild(clueElement);
        });
        const answerField = document.getElementById('answer');
        answerField.textContent = this.host.room.question.name;
        this.finalDrawing.src = this.host.drawingBoard.toDataUrl();
        this.transitionTo('revealArea');
    }
}