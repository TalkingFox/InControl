import { Component } from '../component';
import { Telephone } from '../../telephony/telephone';
import { SendGuess } from '../../models/guess';

export class GuessComponent extends Component {
    constructor(private telephone: Telephone) {
        super();
        const sendGuess = document.getElementById('sendGuess');
        sendGuess.addEventListener('click', () => {
            const guessElement = document.getElementById('guess') as HTMLInputElement;
            const message = new SendGuess(
                this.telephone.player.name,
                guessElement.value
            );
            this.telephone.SendMessage(message);
            this.transitionTo('waitingArea');
        });
    }

    public initialize() {
        this.transitionTo('guessArea');
    }
}