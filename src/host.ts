import * as QRious from 'qrious';
import { Switchboard } from './telephony/switchboard';
import { Room } from './models/room';
import { GiveClue } from './models/events/giveClue';
import { StateChanged, RoomState } from './models/events/stateChanged';
import { Question } from './models/question';
import { Observable, Subject } from 'rxjs';
import { Util } from './util';
import { UserSelected } from './models/events/userSelected';

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

function startGame() {
	switchboard.stopAcceptingNewUsers();
    getQuestions().subscribe((newQuestions: Question[]) => {
		questions = newQuestions;
		Util.Shuffle(questions);
		room.question = questions.pop();
		transitionTo('drawingArea');
		for (let index = 0; index < room.users.length; index++) {
			const user = room.users[index];
			const clue = room.question.clues[index];
			switchboard.dispatchMessage(user, new GiveClue(clue));
		}
		
		const clonedUsers = room.users.slice(0);
		let selectedUser = Util.RandomElement(clonedUsers)
		clonedUsers.splice(clonedUsers.indexOf(selectedUser),1);
		switchboard.dispatchMessageToAll(new UserSelected(selectedUser));
        const waitForDrawings = switchboard.drawings.subscribe(
            (dataUrl: string) => {
				copyToCanvas(dataUrl);
				if (clonedUsers.length === 0) {
					waitForGuesses();
					waitForDrawings.unsubscribe();
					return;
				}
				selectedUser = Util.RandomElement(clonedUsers);
				clonedUsers.splice(clonedUsers.indexOf(selectedUser),1);
				switchboard.dispatchMessageToAll(new UserSelected(selectedUser));
            }
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
