import { Room } from './models/room';
import { Telephone } from './telephony/telephone';
import { DrawingBoard } from './drawing-board';
import { sentDrawing } from './models/events/sentDrawing';
import { RoomState } from './models/events/stateChanged';
import { Subject } from 'rxjs';
import { StateTransition } from './stateTransition';
import { PlayerLogin } from './models/events/playerLogin';
import { Player } from './models/player';
import { DrawingUpdate } from './models/events/drawingUpdate';
import { SendGuess, Guess } from './models/guess';

let drawingBoard: DrawingBoard;
let avatarBoard: DrawingBoard;
let telephone: Telephone;
let stateTransition: StateTransition;
let sendDrawing: HTMLElement;
let player: Player;

window.onload = () => {
    initialize();
};

function initialize() {
    telephone = new Telephone();
    stateTransition = new StateTransition(telephone);
    drawingBoard = new DrawingBoard({elementId: 'drawingBoard'});
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

    const sendGuess = document.getElementById('sendGuess');
    sendGuess.addEventListener('click', () => {
        const guessElement = document.getElementById('guess') as HTMLInputElement;
        const message = new SendGuess(player.name, guessElement.value);
        telephone.SendMessage(message);
        stateTransition.room.setRoomState(RoomState.WaitingForRoundEnd);
    });

    const login = document.getElementById('login');
    login.addEventListener('click', () => {
        const avatarUrl = avatarBoard.toDataUrl();
        player.avatar = avatarUrl;
        telephone.SendMessage(new PlayerLogin(player));
        stateTransition.toWaitingArea();
    });

    connect.addEventListener('click', () => {
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
        
        player = new Player(playerName.value);
        joinRoom(new Room(roomName.value))
            .then(() => {
                stateTransition.toAvatarArea()
                avatarBoard = new DrawingBoard({elementId: 'avatar'});

            },
                  (error: string) => alert('Failed to join room. Reason: '+error));
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
    const subscription = telephone.connect(player, room).subscribe(() => {
        listenForClues();
        listenForCanvasUpdates();
        listenToStateChanges();
        listenForGuesses();
        promise.next();
        promise.complete();
        subscription.unsubscribe();
    }, (error: string) => {
        promise.error(error);
    });
    return promise.toPromise();
}

function listenForClues(): void {
    telephone.clues.subscribe((clue: string) => {
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

function listenForGuesses(): void {
    telephone.guesses.subscribe((newGuesses: Guess[]) => {
        stateTransition.toScoringArea(newGuesses);
    });
}

function listenToStateChanges(): void {
    stateTransition.room.roomState.subscribe((state: RoomState) => {
        switch (state) {
            case RoomState.GiveGuesses:
                stateTransition.toGuessArea();
                break;
            case RoomState.GameEnded:
                stateTransition.toWaitingArea();
                break;
            case RoomState.MyTurn:
                stateTransition.toPlayArea();
                break;
            case RoomState.OtherPlayerSelected:
                stateTransition.toWaitingArea();
                break;
            case RoomState.WaitingForRoundEnd:
                stateTransition.toWaitingArea();
                break;
            default:
                console.log(state);
        }
    });
}