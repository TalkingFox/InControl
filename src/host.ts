import * as QRious from 'qrious';
import { Switchboard } from './telephony/switchboard';
import { Room } from './models/room';
import { GiveClue } from './models/events/giveClue';
import { StateChanged, RoomState } from './models/events/stateChanged';
import { Question } from './models/question';
import { Observable, Subject } from 'rxjs';
import { Util } from './util';
import { PlayerSelected } from './models/events/playerSelected';
import { sentDrawing } from './models/events/sentDrawing';
import { Guess } from './models/events/guess';

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

function transitionTo(area: string) {
    const allAreas = document.querySelectorAll('.container > div');
    allAreas.forEach((value: Element) => {
        if (value.id == area) {
            value.removeAttribute('hidden');
        } else {
            value.setAttribute('hidden', '');
        }
    });
}

function createRoom(roomName: string) {
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
	transitionTo('waitingArea');
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
        const startGameOk = document.getElementById('startGame');
        startGameOk.addEventListener('click', () => {
            startGame();
        });
    });
}

function getQuestions(): Observable<Question[]> {
	const subject = new Subject<Question[]>();
	if (questions) {
		subject.next(questions);
		subject.complete();
	}
	switchboard.getQuestions().subscribe((newQuestions: Question[]) => {
		questions = newQuestions;
		subject.next(questions);
		subject.complete();
	});
	return subject;
}

function takeClues(): GiveClue[] {
	const clues = room.users.map((user: string) => {
		const clue = Util.PopRandomElement(room.question.clues);
		room.usedClues.push(clue);
		return new GiveClue(user, clue);
	});	
	return clues;
}

function takeQuestion(): Question {
	Util.Shuffle(questions);
	return questions.pop();
}

function selectPlayer(): PlayerSelected {
	Util.Shuffle(room.cluelessUsers);
	const player = Util.PopRandomElement(room.cluelessUsers);
	return new PlayerSelected(player);
}

function waitForDrawings(): Observable<string> {
	return switchboard.drawings;
}

function startGame() {
	switchboard.stopAcceptingNewUsers();
	room.cluelessUsers = room.users.slice();
	startNextRound();
}

function displayGuess(guess: Guess): void {
	alert('bananas');
}

function startNextRound(): void{
	if (room.cluelessUsers.length === 0) {
		return endGame();
	}
    getQuestions().subscribe((newQuestions: Question[]) => {
		questions = newQuestions;
		room.question = takeQuestion();		
		transitionTo('drawingArea');
		takeClues().map((clue: GiveClue) => {
			console.log('dispatching clues');
			switchboard.dispatchMessage(clue.body.player, clue);
		});
		
		const player = selectPlayer();
		switchboard.dispatchMessageToAll(player);
		const subscription = waitForDrawings().subscribe((dataUrl: string) => {
			copyToCanvas(dataUrl);
			subscription.add(waitForGuesses().subscribe((guess: Guess) => {
				room.guessedUsers.push(guess.user);
				displayGuess(guess);
				if (room.guessedUsers.length === room.users.length-1){
					subscription.unsubscribe();
					return startNextRound();
				}
			}));		
		});
    });
}

function endGame() {
	displayAnswer();
}

function waitForGuesses(): Observable<Guess> {
    const stateChange = new StateChanged(RoomState.WaitingForGuesses);
    switchboard.dispatchMessageToAll(stateChange);
    return switchboard.guesses;
}

function displayAnswer() {
    const answerField = document.getElementById('answer');
    answerField.textContent = 'The thing was ZEBRA!!!';
    revealRoom.removeAttribute('hidden');
}

window.onload = () => {
    initialize();
};
