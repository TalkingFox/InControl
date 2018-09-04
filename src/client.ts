import { Point } from 'jsqr/dist/locator';
import { Room } from './models/room';
import { Telephone } from './telephony/telephone';
import { DrawingBoard } from './drawing-board';
import { sentDrawing } from './models/events/sentDrawing';
import { Guess } from './models/events/guess';
import { RoomState } from './models/events/stateChanged';
import { Subject, Observable } from 'rxjs';
import { Scanner } from './scanner';

let drawingBoard: DrawingBoard;
let telephone: Telephone;
let scanner: Scanner = new Scanner('scanner');

let loadingMessage: HTMLElement;
let sendDrawing: HTMLElement;

window.onload = () => {
    initialize();
};

function initialize() {
    drawingBoard = new DrawingBoard('drawingBoard');
    const waitingDrawingBoard = new DrawingBoard('waitingDrawingBoard');
    loadingMessage = document.getElementById('loadingMessage');
    const connect = document.getElementById('connect');
    sendDrawing = document.getElementById('sendDrawing');

    const login = document.getElementById('login');
    login.addEventListener('click', () => {
        const username = document.getElementById('username') as HTMLInputElement;
        if (!username.value) {
            alert('It would be really cool if you entered a name.');
            return;
        }
        transitionTo('scanningArea');
        telephone = new Telephone(username.value);
        const subscription = scanner.scanForQrCode().subscribe((room: Room) => {
            joinRoom(room);
            subscription.unsubscribe();
        });
    });

    connect.addEventListener('click', () => {
        const idElement = document.getElementById(
            'connectId'
        ) as HTMLInputElement;
        const id = idElement.value;
        joinRoom(new Room(id, 'butts'));
    });
}

function joinRoom(room: Room) {
    if (!confirm('Is it ok to join room "' + room.name + '"?')) {
        return;
    }
    telephone.connectTo(room).subscribe(() => {
        transitionTo('waitingArea');
        waitForClues();
    });
}

function preparePlayArea() {
    transitionTo('playArea');
    sendDrawing.addEventListener('click', () => {
        const data = drawingBoard.toDataUrl();
        const message = new sentDrawing(data);
        telephone.SendMessage(message);
        waitForStateChange(RoomState.WaitingForGuesses).subscribe(() => {
            transitionTo('guessArea');
            submitFinalGuess();
        });
    });
}

function transitionTo(area: string) {
    const allAreas = document.querySelectorAll('body > div');
    allAreas.forEach((value: Element) => {
        if (value.id == area) {
            value.removeAttribute('hidden');
        } else {
            value.setAttribute('hidden', '');
        }
    });
}

function waitForStateChange(expectedState: RoomState): Observable<void> {
    const waiter = new Subject<void>();
    const subscription = telephone.roomState.subscribe(state => {
        if (state != expectedState) {
            console.log('skipping ', state);
        }
        waiter.next();
        waiter.complete();
    });
    return waiter.asObservable();
}

function waitForClues() {
    const clueSub = telephone.clues.subscribe((clue: string) => {
        const clueElement = document.getElementById('waitingClue');
        clueElement.textContent=clue;
        const playClueElement = document.getElementById('clue');
        playClueElement.textContent = clue;
        clueSub.unsubscribe();
        waitForMyTurn();
    });
}

function waitForMyTurn(): Observable<void> {
    const subject = new Subject<void>();
    const subscription = telephone.selectedUser.subscribe((user: string) => {
        if (user == telephone.user) {
            transitionTo('playArea');
            subscription.unsubscribe();
        }
    });
    return subject.asObservable();
}

function submitFinalGuess() {
    transitionTo('guessArea');
    const sendGuess = document.getElementById('sendGuess');
    sendGuess.addEventListener('click', () => {
        const guessElement = document.getElementById(
            'guess'
        ) as HTMLInputElement;
        const guess = new Guess(guessElement.value);
        telephone.SendMessage(guess);
    });
}
