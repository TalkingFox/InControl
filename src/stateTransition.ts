import { Room } from "./models/room";

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

    public toJoinArea(): void{
        this.transitionTo('joinArea');
    }

    public toAvatarArea(): void {
        this.transitionTo('avatarArea');
    }

    public toWaitingArea(): void {
        this.transitionTo('waitingArea');
    }

    private transitionTo(area: string) {
        const allAreas = document.querySelectorAll('body > div');
        allAreas.forEach((value: Element) => {
            if (!value.id) {
                return;
            }
            if (value.id == area) {
                value.classList.remove('hidden');
            } else {
                value.classList.add('hidden');
            }
        });
    }
}