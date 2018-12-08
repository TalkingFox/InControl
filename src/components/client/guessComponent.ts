import { SendGuess } from '../../models/guess';
import { Telephone } from '../../telephony/telephone';
import { Component } from '../component';

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
                guess,
            );
            this.telephone.SendMessage(message);
            this.transitionTo('waitingArea');
        });
    }

    public initialize() {
        this.transitionTo('guessArea');
    }
}
