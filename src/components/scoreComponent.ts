import { Guess } from "../models/guess";
import { GuessScore } from "../models/guessScore";

export class ScoreComponent {
    private guessScore: Map<string, GuessScore>;
    private guessTable: HTMLElement;

    public initialize(newGuesses: Guess[]) {
        console.log('scoring area');
        this.guessScore = new Map<string,GuessScore>();
        newGuesses.map((guess: Guess) => {
            this.guessScore.set(guess.user,new GuessScore());
        });
        this.guessTable = document.getElementById('guesses');
        while(this.guessTable.firstChild) {
            // clear guesses
            this.guessTable.removeChild(this.guessTable.firstChild);
        }
        this.createGuessRows(newGuesses);
    }

    private createGuessRows(guesses: Guess[]): void{

        guesses.map((guess: Guess) => {
            const newRow = document.createElement('tr');
            const guessBody = document.createElement('td');
            const guessElement = document.createElement('div');
            guessElement.textContent = guess.guess;
            guessBody.appendChild(guessElement);
            
            const likeBody = document.createElement('td');
            const likeElement = document.createElement('i');
            likeElement.classList.add('fas', 'fa-thumbs-up');
            likeElement.addEventListener('click',() => {
                const isLiked = !likeElement.classList.contains('isLiked');
                likeElement.classList.remove('isLiked');
                const score = this.guessScore.get(guess.user)
                score.isLiked = isLiked;
                if (isLiked) {
                    funnyElement.classList.add('isLiked');
                }
            });
            likeBody.appendChild(likeElement);

            const funnyBody = document.createElement('td');
            const funnyElement = document.createElement('div')
            funnyElement.classList.add('fas', 'fa-grin-squint');
            funnyElement.addEventListener('click',() => {
                const isFunny = !funnyElement.classList.contains('isFunny');
                funnyElement.classList.remove('isFunny');                
                const score = this.guessScore.get(guess.user)
                score.isFunny = isFunny;
                if (isFunny){
                    funnyElement.classList.add('isFunny');
                }
            });
            funnyBody.appendChild(funnyElement);

            newRow.appendChild(guessBody);
            newRow.appendChild(likeBody);
            newRow.appendChild(funnyBody);
            this.guessTable.appendChild(newRow)
        });
    }
}