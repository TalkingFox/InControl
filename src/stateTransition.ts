import { Room } from "./models/room";

export class StateTransition {
    public room: Room;
    private _hide: EventListener;

    constructor(){}

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
        const allAreas = document.querySelectorAll('.master-container > div');
        allAreas.forEach((value: Element) => {
            if (!value.id) {
                return;
            }
            if (value.id == area) {
                value.classList.remove('hidden');
                value.classList.remove('slide-out')
                value.classList.add('slide-in');
            } else if (value.classList.contains('hidden')) {
                return;
            } else {
                value.classList.remove('slide-in');
                value.classList.add('slide-out');                
                this._hide = this.hide.bind(this);
                value.addEventListener('animationend', this._hide);
                value.addEventListener('webkitAnimationEnd', this._hide);
            }
        });
    }

    private hide(event: Event) {        
        event.srcElement.classList.add('hidden');
        event.srcElement.classList.remove('slide-out');
        event.srcElement.removeEventListener('animationend', this._hide);
        event.srcElement.removeEventListener('webkitAnimationEnd', this._hide);
    }
}