import { Subject } from "rxjs";
import { Room } from "./models/room";
import { RoomState } from "./models/events/stateChanged";
import { Scanner } from "./scanner";

export class StateTransition {
    public room: Room;

    constructor(){
    }

    public toGuessArea(): void {
        this.transitionTo('guessArea');
    }

    public toPlayArea(): void {
        this.transitionTo('playArea');
    }

    public toScanningArea(): void{
        this.transitionTo('scanningArea');
    }

    public toWaitingArea(): void {
        this.transitionTo('waitingArea');
    }

    private transitionTo(area: string) {
        const allAreas = document.querySelectorAll('body > div');
        allAreas.forEach((value: Element) => {
            if (value.id == area) {
                value.classList.remove('hidden');
            } else {
                value.classList.add('hidden');
            }
        });
    }
}