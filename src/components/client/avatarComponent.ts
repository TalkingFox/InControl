import { DrawingBoard } from '../../drawing-board';
import { PlayerLogin } from '../../models/events/playerLogin';
import { Telephone } from '../../telephony/telephone';
import { Component } from '../component';

export class AvatarComponent extends Component {
    private board: DrawingBoard;

    constructor(private telephone: Telephone) {
        super();
        const login = document.getElementById('login');
        login.addEventListener('click', () => {
            const avatarUrl = this.board.toDataUrl();
            this.telephone.player.avatar = avatarUrl;
            this.telephone.SendMessage(new PlayerLogin(telephone.player));
            this.transitionTo('waitingArea');
        });
        this.board = new DrawingBoard({elementId: 'avatar'});
    }

    public initialize() {
        this.transitionTo('avatarArea');
    }
}
