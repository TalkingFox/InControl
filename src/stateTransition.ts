import { Subject } from "rxjs";
import { Room } from "./models/room";
import { RoomState } from "./models/events/stateChanged";
import { Scanner } from "./scanner";

export class StateTransition {
    private scanner: Scanner;
    public room: Room;

    constructor(){
        this.scanner = new Scanner('scanner');
    }

    public toGuessArea(): void {
        this.transitionTo('guessArea');
    }

    public toPlayArea(): void {
        this.transitionTo('playArea');
    }

    public toScanningArea(): Promise<Room>{
        this.transitionTo('scanningArea');
        return this.scanner.scanForQrCode();
    }

    public toWaitingArea(): void {
        this.transitionTo('waitingArea');
    }

    private transitionTo(area: string) {
        const allAreas = document.querySelectorAll('body > div');
        allAreas.forEach((value: Element) => {
            if (value.id == area) {
                value.removeAttribute('hidden');
            } else {
                value.setAttribute('hidden', '');
            }
        });
    }
}