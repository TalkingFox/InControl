import { Observable } from 'rxjs';
import { PlayerSelected } from '../../models/events/playerSelected';
import { Util } from '../../util';
import { Component } from '../component';
import { HostComponent } from './hostComponent';

export class DrawingComponent extends Component {

    private currentPlayer: HTMLElement;

    constructor(private host: HostComponent) {
        super();
        this.currentPlayer = document.getElementById('currentPlayer');
    }

    public initialize(): void {
        this.transitionTo('drawingArea');
        this.selectPlayer();
        const subscription = this.waitForDrawings().subscribe((dataUrl: string) => {
            subscription.unsubscribe();
            this.host.drawingBoard.loadDataUrl(dataUrl);
            this.host.startNextRound();
        });
    }

    private waitForDrawings(): Observable<string> {
	    return this.host.switchboard.drawings;
    }

    private selectPlayer(): void {
        Util.Shuffle(this.host.room.cluelessUsers);
        const player = Util.PopRandomElement(this.host.room.cluelessUsers);
        const selected = new PlayerSelected(player, this.host.drawingBoard.toDataUrl());
        this.host.switchboard.dispatchMessageToAll(selected);
        this.currentPlayer.textContent = player;
    }

}
