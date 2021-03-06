import { Component } from '../../core/component';
import { Util } from '../../core/util';
import { Guess } from '../../models/event-bodies/guess';
import { GuessesScored } from '../../models/events/guessesScored';
import { GuessScore } from '../../models/guessScore';
import { Telephone } from '../telephone';

export class ScoreComponent extends Component {
    private guessScore: Map<string, GuessScore>;
    private guessTable: HTMLElement;

    constructor(private telephone: Telephone) {
        super();
        const submit = document.getElementById('submitScores');
        submit.addEventListener('click', () => {
            const message = new GuessesScored([...this.guessScore.values()]);
            this.telephone.SendMessage(message);
            this.setWaiting(true);
        });
    }

    public initialize(newGuesses: Guess[]): void {
        this.setWaiting(false);
        this.guessScore = new Map<string, GuessScore>();
        newGuesses.map((guess: Guess) => {
            const score = new GuessScore(guess);
            score.scoredBy = this.telephone.player.name;
            this.guessScore.set(guess.user, score);
        });
        this.guessTable = document.getElementById('guesses');
        Util.ClearElement(this.guessTable);
        this.createGuessRows(newGuesses);
        this.transitionTo('scoringArea');
    }

    private setWaiting(isWaiting: boolean): void {
        const activeArea = document.getElementById('scoringMain');
        const waitArea = document.getElementById('scoringWait');

        if (isWaiting) {
            activeArea.classList.add('hidden');
            waitArea.classList.remove('hidden');
        } else {
            activeArea.classList.remove('hidden');
            waitArea.classList.add('hidden');
        }
    }

    private createGuessRows(guesses: Guess[]): void {
        guesses.map((guess: Guess) => {
            const newRow = document.createElement('tr');
            const guessBody = document.createElement('td');
            const guessElement = document.createElement('div');
            guessElement.textContent = guess.guess;
            guessBody.appendChild(guessElement);

            const likeBody = document.createElement('td');
            const likeElement = document.createElement('i');
            likeElement.classList.add('fas', 'fa-thumbs-up', 'click');
            likeElement.addEventListener('click', () => {
                const score = this.guessScore.get(guess.user);
                likeElement.classList.remove('selected');
                score.isLiked = !score.isLiked;
                if (score.isLiked) {
                    likeElement.classList.add('selected');
                }
            });
            likeBody.appendChild(likeElement);

            const funnyBody = document.createElement('td');
            const funnyElement = document.createElement('div');
            funnyElement.classList.add('fas', 'fa-grin-squint', 'click');
            funnyElement.addEventListener('click', () => {
                const score = this.guessScore.get(guess.user);
                funnyElement.classList.remove('selected');
                score.isFunny = !score.isFunny;
                if (score.isFunny) {
                    funnyElement.classList.add('selected');
                }
            });
            funnyBody.appendChild(funnyElement);

            newRow.appendChild(guessBody);
            newRow.appendChild(likeBody);
            newRow.appendChild(funnyBody);
            this.guessTable.appendChild(newRow);
        });
    }
}
