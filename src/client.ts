import jsQR, { QRCode } from 'jsqr';
import { Point } from 'jsqr/dist/locator';
import { Room } from './models/room';
import { Telephone } from './telephony/telephone';
import { DrawingBoard } from './drawing-board';
import { NewDrawing } from './models/events/new-drawing';
import { Guess } from './models/events/guess';
import { RoomState } from './models/events/stateChanged';
import { Subject, Observable } from 'rxjs';

let drawingBoard: DrawingBoard;
const telephone: Telephone = new Telephone('tacoman');
let video: HTMLVideoElement;
let scanner: HTMLCanvasElement;
let scannerContext: CanvasRenderingContext2D;
let loadingMessage: HTMLElement;
let guessArea: HTMLElement;
let sendDrawing: HTMLElement;

function initialize() {
    guessArea = document.getElementById('guessArea');
    drawingBoard = new DrawingBoard('drawingBoard');
    video = document.createElement('video');
    scanner = document.getElementById('scanner') as HTMLCanvasElement;
    scannerContext = scanner.getContext('2d');
    loadingMessage = document.getElementById('loadingMessage');
    const connect = document.getElementById('connect');
    sendDrawing = document.getElementById('sendDrawing');
    connect.addEventListener('click', () => {
        const idElement = document.getElementById('connectId') as HTMLInputElement;
        const id = idElement.value;
        joinRoom(new Room(id, 'butts'));
    });   
}

function analyzeFrame() {
    loadingMessage.innerText = 'Loading video...';
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        return requestAnimationFrame(analyzeFrame);
    }

    scanner.height = video.videoHeight;
    scanner.width = video.videoWidth;
    scannerContext.drawImage(video, 0, 0, scanner.width, scanner.height);
    const imageData = scannerContext.getImageData(0, 0, scanner.width, scanner.height);
    const code: QRCode = jsQR(imageData.data, imageData.width, imageData.height);
    if (!code) {
        return requestAnimationFrame(analyzeFrame);
    }

    drawLine(code.location.topLeftCorner, code.location.topRightCorner);
    drawLine(code.location.topRightCorner, code.location.bottomRightCorner);
    drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner);
    drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner);
    video.pause();
    const room = JSON.parse(code.data) as Room;
    joinRoom(room);
}

function drawLine(start: Point, end: Point) {
    scannerContext.beginPath();
    scannerContext.moveTo(start.x, start.y);
    scannerContext.lineTo(end.x, end.y);
    scannerContext.lineWidth = 4;
    scannerContext.strokeStyle = 'yellow';
    scannerContext.stroke();
}

function joinRoom(room: Room) {
    if (!confirm('Is it ok to join room "' + room.name + '"?')) {
        return;
    }
    console.log('conecting...');
    telephone.connectTo(room).subscribe(() => {
        console.log('connected');
        preparePlayArea();
    });
}

function preparePlayArea() {
    console.log('prepping play area');
    const scanningArea = document.getElementById('scanningArea');
    scanningArea.setAttribute('hidden','');
    const playArea = document.getElementById('playArea');
    playArea.removeAttribute('hidden');
    waitForClues();
    sendDrawing.addEventListener('click', () => {
        const data = drawingBoard.toDataUrl();
        const message = new NewDrawing(data);
        telephone.SendMessage(message);
        waitForStateChange(RoomState.WaitingForGuesses).subscribe(() => {
            playArea.setAttribute('hidden','');
            guessArea.removeAttribute('hidden');
            submitFinalGuess();
        });
    })
}

function waitForStateChange(expectedState: RoomState): Observable<void> {
    const waiter = new Subject<void>();
    const subscription = telephone.roomState.subscribe((state) => {
        if (state != expectedState) {
            console.log('skipping ',state);
        }
        waiter.next();
        waiter.complete();
    });
    return waiter.asObservable();
}

function waitForClues() {
    console.log('waiting for clues');
    const clueSub = telephone.clues.subscribe((clue: string) => {
        alert('Your clue is: "'+clue+'"');
        clueSub.unsubscribe();
    });
}

function waitForNewRound() {
    console.log('waiting for answer');
}

function submitFinalGuess() {
    guessArea.removeAttribute('hidden');
    const sendGuess = document.getElementById('sendGuess');
    sendGuess.addEventListener('click', () => {
        const guessElement = document.getElementById('guess') as HTMLInputElement;
        const guess = new Guess(guessElement.value);
        telephone.SendMessage(guess);
        waitForNewRound();
    });    
}

function startScanning() {
    const mediaConstraints: MediaStreamConstraints = {
        video: {
            facingMode: 'environment'
    }};
    // use facingMode: environment to get front camera on phones
    navigator.mediaDevices.getUserMedia(mediaConstraints)
        .then((stream: MediaStream) => {
            video.srcObject = stream;
            // required for ios safari
            video.setAttribute('playsinline', 'true');
            video.play();
            requestAnimationFrame(analyzeFrame);
        });
}

window.onload = () => {
    initialize();
    startScanning();
}