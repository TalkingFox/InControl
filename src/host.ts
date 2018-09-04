import * as QRious from 'qrious';
import { Switchboard } from './telephony/switchboard';
import { Room } from './models/room';
import { GiveClue } from './models/events/giveClue';
import { StateChanged, RoomState } from './models/events/stateChanged';
import { Question } from './models/question';

const switchboard: Switchboard = new Switchboard();
let drawingBoard: HTMLCanvasElement;
let drawingBoardContext: CanvasRenderingContext2D;
let room: Room;
let questions: Question[];
let waitingRoom: HTMLElement;
let revealRoom: HTMLElement;
let users: HTMLElement;

function initialize() {
    revealRoom = document.getElementById('revealRoom');
    waitingRoom = document.getElementById('waitingRoom');
    drawingBoard = document.getElementById('drawingBoard') as HTMLCanvasElement;
    drawingBoardContext = drawingBoard.getContext('2d');
    users = document.getElementById('users');
    const roomMaker = document.getElementById('createRoom');
    roomMaker.addEventListener('click', () => {
        const roomElement = document.getElementById(
            'roomName'
        ) as HTMLInputElement;
        if (!roomElement.value) {
            alert('Please enter a room name.');
            return;
        }
        createRoom(roomElement.value);
    });
}

function createRoom(roomName: string) {
    const roomContainer = document.getElementById('roomInformation');
    roomContainer.setAttribute('hidden', '');
    initializeWaitingRoom(roomName);
}

function copyToCanvas(dataUrl: string) {
    const image: HTMLImageElement = new Image();
    image.onload = () => {
        drawingBoardContext.drawImage(image, 0, 0);
    };
    image.src = dataUrl;
}

function userJoined(user: string) {
    room.users.push(user);
    let newUser = document.createElement('li');
    newUser.textContent = user;
    users.appendChild(newUser);
}

function initializeWaitingRoom(roomName: string) {
    switchboard.startListening().subscribe((id: string) => {
        const idHaver = document.getElementById('roomId') as HTMLInputElement;
        idHaver.value = id;
        room = new Room(id, roomName);
        const qr = new QRious({
            element: document.getElementById('qrCode'),
            value: JSON.stringify(room)
        });
        switchboard.users.subscribe((user: string) => {
            userJoined(user);
        });
        const waitingRoom = document.getElementById('waitingRoom');
        waitingRoom.removeAttribute('hidden');
        const startGameOk = document.getElementById('startGame');
        startGameOk.addEventListener('click', () => {
            startGame();
        });
    });
}

function startGame() {
    switchboard.getQuestions().subscribe((newQuestions: Question[]) => {
		console.log(newQuestions);
		questions = newQuestions;
        waitingRoom.setAttribute('hidden', '');
        const drawingRoom = document.getElementById('drawingRoom');
        drawingRoom.removeAttribute('hidden');
        switchboard.stopAcceptingNewUsers();
        const waitForDrawings = switchboard.drawings.subscribe(
            (dataUrl: string) => {
                console.log('drawing receieved');
                copyToCanvas(dataUrl);
                waitForGuesses();
                waitForDrawings.unsubscribe();
            }
        );
        switchboard.dispatchMessage(
            room.users[0],
            new GiveClue('Animal with four legs.')
        );
    });
}

function waitForGuesses() {
    const stateChange = new StateChanged(RoomState.WaitingForGuesses);
    switchboard.dispatchMessageToAll(stateChange);
    switchboard.guesses.subscribe((guess: string) => {
        alert('received guess ' + guess);
        displayAnswer();
    });
}

function displayAnswer() {
    const answerField = document.getElementById('answer');
    answerField.textContent = 'The thing was ZEBRA!!!';
    revealRoom.removeAttribute('hidden');
}

window.onload = () => {
    initialize();
};
