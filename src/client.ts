import { Room } from './models/room';
import { Telephone } from './telephony/telephone';
import { DrawingBoard } from './drawing-board';
import { sentDrawing } from './models/events/sentDrawing';
import { RoomState } from './models/events/stateChanged';
import { Subject } from 'rxjs';
import { StateTransition } from './stateTransition';
import { Player } from './models/player';
import { DrawingUpdate } from './models/events/drawingUpdate';
import { Guess } from './models/guess';
import { GuessComponent } from './components/client/guessComponent';
import { ScoreComponent } from './components/client/scoreComponent';
import { WaitingComponent } from './components/client/waitingComponent';
import { PlayComponent } from './components/client/playComponent';
import { AvatarComponent } from './components/client/avatarComponent';

let drawingBoard: DrawingBoard;
let telephone: Telephone;
let stateTransition: StateTransition;
let sendDrawing: HTMLElement;
let guessComponent: GuessComponent;
let scoreComponent: ScoreComponent;
let waitingComponent: WaitingComponent = new WaitingComponent();
let playComponent: PlayComponent = new PlayComponent();
let avatarComponent: AvatarComponent;

window.onload = () => {
    initialize();
};

function initialize() {
    telephone = new Telephone();
    stateTransition = new StateTransition();
    guessComponent = new GuessComponent(telephone);
    scoreComponent = new ScoreComponent(telephone);
    avatarComponent = new AvatarComponent(telephone);
    drawingBoard = new DrawingBoard({ elementId: 'drawingBoard' });
    drawingBoard.mouseUp.subscribe(() => {
        sendDrawingUpdate();
    });
    const connect = document.getElementById('connect');
    sendDrawing = document.getElementById('sendDrawing');
    sendDrawing.addEventListener('click', () => {
        const data = drawingBoard.toDataUrl();
        const message = new sentDrawing(data);
        telephone.SendMessage(message);
        stateTransition.room.setRoomState(RoomState.WaitingForRoundEnd);
        drawingBoard.ClearCanvas();
    });    

    connect.addEventListener('click', () => {
        const roomName = document.getElementById(
            'roomName'
        ) as HTMLInputElement;
        const playerName = document.getElementById(
            'username'
        ) as HTMLInputElement;
        if (!roomName.value) {
            alert('Enter a room name.');
            return;
        }
        if (!playerName.value) {
            alert('Please enter a name');
            return;
        }

        telephone.player = new Player(playerName.value);
        joinRoom(new Room(roomName.value)).then(
            () => {
                avatarComponent.initialize();
            },
            (error: string) => alert('Failed to join room. Reason: ' + error)
        );
    });
}

function sendDrawingUpdate() {
    const dataUrl = drawingBoard.toDataUrl();
    const update = new DrawingUpdate(dataUrl);
    telephone.SendMessage(update);
}

function joinRoom(room: Room): Promise<void> {
    stateTransition.room = room;
    const promise = new Subject<void>();
    const subscription = telephone
        .connect(room)
        .subscribe(
            () => {
                listenForClues();
                listenForCanvasUpdates();
                listenToStateChanges();
                listenForGuesses();
                promise.next();
                promise.complete();
                subscription.unsubscribe();
            },
            (error: string) => {
                promise.error(error);
            }
        );
    return promise.toPromise();
}

function listenForClues(): void {
    telephone.clues.subscribe((clue: string) => {
        const clueElement = document.getElementById('clue');
        clueElement.textContent = 'Clue: ' + clue;
        clueElement.classList.remove('hidden');
    });
}

function listenForCanvasUpdates(): void {
    stateTransition.room.canvas.subscribe(data => {
        drawingBoard.loadDataUrl(data);
    });
}

function listenForGuesses(): void {
    telephone.guesses.subscribe((newGuesses: Guess[]) => {
        scoreComponent.initialize(newGuesses);
    });
}

function listenToStateChanges(): void {
    stateTransition.room.roomState.subscribe((state: RoomState) => {
        console.log('roomstate', state);
        switch (state) {
            case RoomState.GiveGuesses:
                guessComponent.initialize();
                break;
            case RoomState.GameEnded:
                waitingComponent.initialize();
                break;
            case RoomState.MyTurn:
                playComponent.initialize();
                break;
            case RoomState.OtherPlayerSelected:
                waitingComponent.initialize();
                break;
            case RoomState.WaitingForRoundEnd:
                waitingComponent.initialize();
                break;
            default:
                console.log(state);
        }
    });
}
