import { Room } from './models/room';
import { Telephone } from './telephony/telephone';
import { DrawingBoard } from './drawing-board';
import { sentDrawing } from './models/events/sentDrawing';
import { SendGuess } from './models/events/guess';
import { RoomState } from './models/events/stateChanged';
import { Subject, Observable } from 'rxjs';
import { StateTransition } from './stateTransition';
import { Scanner } from './scanner';

let drawingBoard: DrawingBoard;
let telephone: Telephone;
let stateTransition: StateTransition;
let scanner: Scanner;
let loadingMessage: HTMLElement;
let sendDrawing: HTMLElement;

window.onload = () => {
    initialize();
};

function initialize() {
    scanner = new Scanner('scanner');
    stateTransition = new StateTransition();
    drawingBoard = new DrawingBoard({elementId: 'drawingBoard'});
    loadingMessage = document.getElementById('loadingMessage');
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
        const message = new SendGuess(telephone.user, guessElement.value);
        telephone.SendMessage(message);
        stateTransition.room.setRoomState(RoomState.WaitingForRoundEnd);
    });

    const login = document.getElementById('login');
    login.addEventListener('click', () => {
        const username = document.getElementById('username') as HTMLInputElement;
        if (!username.value) {
            alert('It would be really cool if you entered a name.');
            return;
        }
        telephone = new Telephone(username.value);
        stateTransition.toScanningArea();
    });

    connect.addEventListener('click', () => {
        const id = document.getElementById('connectId') as HTMLInputElement;
        const roomName = document.getElementById('roomName') as HTMLInputElement;        
        joinRoom(new Room(id.value, roomName.value))
            .then(() => stateTransition.toWaitingArea());
    });

    const beginScan = document.getElementById('beginScan');
    beginScan.addEventListener('click', () => {
        scanner.scanForQrCode().then((room: Room) => {
            const id = document.getElementById('connectId') as HTMLInputElement;
            const roomName = document.getElementById('roomName') as HTMLInputElement;
            id.value = room.id;
            roomName.value = room.name;
        }, (error) => {
            const scanError = document.getElementById('scanError');
            scanError.textContent = error;
            scanError.removeAttribute('hidden');
        })        
    });
}

function joinRoom(room: Room): Promise<void> {
    if (!confirm('Is it ok to join room "' + room.name + '"?')) {
        return Promise.reject();
    }
    stateTransition.room = room;
    const promise = new Subject<void>();
    const subscription = telephone.connectTo(room).subscribe(() => {
        listenForClues();
        listenForCanvasUpdates();
        listenToStateChanges();
        promise.next();
        promise.complete();
        subscription.unsubscribe();
    });
    return promise.toPromise();
}

function listenForClues(): void {
    telephone.clues.subscribe((clue: string) => {
        const clueElement = document.getElementById('clue');
        clueElement.textContent='Clue: '+clue;
        clueElement.removeAttribute('hidden');
        const clueHelper = document.getElementById('clue-help');
        clueHelper.removeAttribute('hidden');
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