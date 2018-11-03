import { Room } from "./models/room";
import { Guess } from "./models/guess";
import { ScoreComponent } from "./components/scoreComponent";

export class StateTransition {
    public room: Room;
    private score: ScoreComponent;

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

    public toScoringArea(newGuesses: Guess[]): void {
        this.score = new ScoreComponent();
        this.score.initialize(newGuesses);
        this.transitionTo('scoringArea');        
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