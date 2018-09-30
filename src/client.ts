import { Room } from './models/room';
import { Telephone } from './telephony/telephone';
import { DrawingBoard } from './drawing-board';
import { sentDrawing } from './models/events/sentDrawing';
import { SendGuess } from './models/events/guess';
import { RoomState } from './models/events/stateChanged';
import { Subject } from 'rxjs';
import { StateTransition } from './stateTransition';
import { PlayerLogin } from './models/events/playerLogin';
import { Player } from './models/player';

let drawingBoard: DrawingBoard;
let avatarBoard: DrawingBoard;
let telephone: Telephone;
let stateTransition: StateTransition;
let sendDrawing: HTMLElement;

window.onload = () => {
    initialize();
};

function initialize() {
    stateTransition = new StateTransition();
    drawingBoard = new DrawingBoard({elementId: 'drawingBoard'});
    const connect = document.getElementById('connect');
    sendDrawing = document.getElementById('sendDrawing');
    sendDrawing.addEventListener('click', () => {
        const data = drawingBoard.toDataUrl();
        const message = new sentDrawing(data);
        telephone.SendMessage(message);
        stateTransition.room.setRoomState(RoomState.WaitingForRoundEnd);
        drawingBoard.ClearCanvas();
    });

    const sendGuess = document.getElementById('sendGuess');
    sendGuess.addEventListener('click', () => {
        const guessElement = document.getElementById('guess') as HTMLInputElement;
        const message = new SendGuess(telephone.player.name, guessElement.value);
        telephone.SendMessage(message);
        stateTransition.room.setRoomState(RoomState.WaitingForRoundEnd);
    });

    const login = document.getElementById('login');
    login.addEventListener('click', () => {
        const username = document.getElementById('username') as HTMLInputElement;
        const avatarUrl = avatarBoard.toDataUrl();
        const player = new Player(username.value, avatarUrl);
        telephone.player = player;
        telephone.SendMessage(new PlayerLogin(player));
        stateTransition.toWaitingArea();
    });

    connect.addEventListener('click', () => {
        console.log('joining room');
        const roomName = document.getElementById('roomName') as HTMLInputElement;
        const playerName = document.getElementById('username')as HTMLInputElement;
        if (!roomName.value) {
            alert('Enter a room name.')
            return;
        }
        if (!playerName.value) {
            alert('Please enter a name');
            return;
        }
        
        telephone = new Telephone(new Player(playerName.value,''));
        joinRoom(new Room(roomName.value))
            .then(() => {
                stateTransition.toAvatarArea()
                avatarBoard = new DrawingBoard({elementId: 'avatar'});

            },
                  (error: string) => alert('Failed to join room. Reason: '+error));
    });
    
}

function joinRoom(room: Room): Promise<void> {
    stateTransition.room = room;
    const promise = new Subject<void>();
    const subscription = telephone.connectTo(room).subscribe(() => {
        listenForClues();
        listenForCanvasUpdates();
        listenToStateChanges();
        promise.next();
        promise.complete();
        subscription.unsubscribe();
        console.log('joined room');
    }, (error: string) => {
        promise.error(error);
    });
    return promise.toPromise();
}

function listenForClues(): void {
    telephone.clues.subscribe((clue: string) => {
        console.log('got clue');
        const clueElement = document.getElementById('clue');
        clueElement.textContent='Clue: '+clue;
        clueElement.classList.remove('hidden');
    });
}

function listenForCanvasUpdates(): void {
    stateTransition.room.canvas.subscribe((data) => {
        drawingBoard.loadDataUrl(data);
    });
}

function listenToStateChanges(): void {
    stateTransition.room.roomState.subscribe((state: RoomState) => {
        switch (state) {
            case RoomState.FinalGuess:
                stateTransition.toGuessArea();
                break;
            case RoomState.GameEnded:
                stateTransition.toWaitingArea();
                break;
            case RoomState.MyTurn:
                stateTransition.toPlayArea();
                break;
            case RoomState.OtherPlayerSelected:
                stateTransition.toGuessArea();
                break;
            case RoomState.WaitingForRoundEnd:
                stateTransition.toWaitingArea();
                break;
            default:
                console.log(state);
        }
    });
}