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
        const finalGuesses = this.createScoreCards(scoredGuesses);
        const guessedTable = document.getElementById('guesses');
        finalGuesses.forEach((scoreCard: GuessScoreCard) => {
            const row = this.createScoreRow(scoreCard);
            guessedTable.appendChild(row);
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

    private createScoreCards(scores: GuessScore[]): Map<string, GuessScoreCard> {
        const finalGuesses = new Map<string, GuessScoreCard>();
        scores.map((guessScore: GuessScore) => {
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
        return finalGuesses;
    }

    private createScoreRow(card: GuessScoreCard): HTMLElement {
        const row = document.createElement('tr');
        
        const playerBody = document.createElement('td');
        const playerText = document.createElement('div');
        playerText.textContent = card.guess.user;
        playerBody.appendChild(playerText);
        row.appendChild(playerBody);

        const guessBody = document.createElement('td');
        const guessText = document.createElement('div');
        guessText.textContent = card.guess.guess;
        guessBody.appendChild(guessText);
        row.appendChild(guessBody);

        const likeBody = document.createElement('td');
        likeBody.classList.add('icon-count');
        const likeText = document.createElement('span');
        likeText.textContent = `${card.likes} × `;
        const likeIcon = document.createElement('i');
        likeIcon.classList.add('fas', 'fa-thumbs-up');
        likeBody.appendChild(likeText);
        likeBody.appendChild(likeIcon);
        row.appendChild(likeBody);

        const funnyBody = document.createElement('td');
        funnyBody.classList.add('icon-count');
        const funnyText = document.createElement('span');
        funnyText.textContent = `${card.funnies} × `;
        const funnyIcon = document.createElement('i');
        funnyIcon.classList.add('fas', 'fa-grin-squint');
        funnyBody.appendChild(funnyText);
        funnyBody.appendChild(funnyIcon);
        row.appendChild(funnyBody);

        return row;
    }
}