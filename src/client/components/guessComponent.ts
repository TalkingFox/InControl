import { Component } from '../../core/component';
import { SendGuess } from '../../models/sendGuess';
import { Telephone } from '../telephone';

export class GuessComponent extends Component {
    constructor(private telephone: Telephone) {
        super();
        const guessInput = document.getElementById('guess') as HTMLInputElement;
        guessInput.value = '';
        const sendGuess = document.getElementById('sendGuess');
        sendGuess.addEventListener('click', () => {
            const guessElement = document.getElementById('guess') as HTMLInputElement;
            const guess = guessElement.value;
            if (!guess) {
                alert('Please enter a guess');
                return;
            }
            const message = new SendGuess(
                this.telephone.player.name,
                guess
            );
            this.telephone.SendMessage(message);
            this.transitionTo('waitingArea');
        });
    }

    public initialize(): void {
        this.transitionTo('guessArea');
    }
}
