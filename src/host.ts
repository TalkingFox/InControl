import * as QRious from 'qrious';
import { Switchboard } from './telephony/switchboard';
import { Room } from './models/room';
import { GiveClue } from './models/events/giveClue';
import { StateChanged, RoomState } from './models/events/stateChanged';
import { Question } from './models/question';
import { Observable, Subject } from 'rxjs';
import { Util } from './util';
import { PlayerSelected } from './models/events/playerSelected';
import { Guess } from './models/events/guess';
import { TalkativeArray } from './models/talkative-array';
import { DrawingBoard } from './drawing-board';

const switchboard: Switchboard = new Switchboard();
let drawingBoard: DrawingBoard;
let room: Room;
let questions: Question[];
let waitingRoom: HTMLElement;
let revealRoom: HTMLElement;
let users: HTMLElement;
let guesses: TalkativeArray<Guess>;

function initialize() {
    guesses = new TalkativeArray<Guess>();
    drawingBoard = new DrawingBoard({elementId: 'drawingBoard', isReadOnly: true});
    switchboard.guesses.subscribe((guess: Guess) => guesses.Push(guess));
    revealRoom = document.getElementById('revealArea');
    waitingRoom = document.getElementById('waitingRoom');
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

    const replay = document.getElementById('replay');
    replay.addEventListener('click', () => {
        drawingBoard.ClearCanvas();
        startGame();
    });
    replay.addEventListener('click', () => {
        questions = null;
        startGame();
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

function getQuestions(): Promise<Question[]> {
    console.log('getting questions');
	if (questions) {
        console.log('returning early');
        return Promise.resolve(questions);
    }
	const subject = new Subject<Question[]>();
	switchboard.getQuestions().subscribe((newQuestions: Question[]) => {
		questions = newQuestions;
		subject.next(questions);
		subject.complete();
	});
	return subject.toPromise();
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
    getQuestions()
        .then((newQuestions: Question[]) => {
            if (newQuestions.length === 0) {
                transitionTo('outOfQuestions');
                return;
            }
            questions = newQuestions;
            room.question = takeQuestion();		
            room.cluelessUsers = room.users.slice();
            startNextRound();
        });	
}

function startNextRound(): void{
    console.log('starting the next round');
	if (room.cluelessUsers.length === 0) {
		return endGame();
	}
    transitionTo('drawingArea');
    takeClues().map((clue: GiveClue) => {
        console.log('dispatching clues');
        switchboard.dispatchMessage(clue.body.player, clue);
    });
    
    const player = selectPlayer();
    switchboard.dispatchMessageToAll(player);
    const subscription = waitForDrawings().subscribe((dataUrl: string) => {
        subscription.unsubscribe();
        drawingBoard.loadDataUrl(dataUrl);
        waitForGuesses()
            .then((guess: Guess[]) => startNextRound())
    });
}

function endGame() {
    console.log("entering final guess!");
    const stateChange = new StateChanged(RoomState.FinalGuess);
    switchboard.dispatchMessageToAll(stateChange);
    console.log('sent state to all');
    waitForGuesses()
        .then((guesses: Guess[]) => displayAnswer());
}

function waitForGuesses(): Promise<Guess[]> {
    console.log('waiting for guesses');
    if (guesses.length === room.users.length - 1) {
        const resolution = Promise.resolve(guesses.elements.splice(0));
        guesses.clear();
        console.log('returning resolution');
        return resolution;
    }
    const promise = new Subject<Guess[]>();
    const subscription = guesses.Subscribe(() => {
        if (guesses.length === room.users.length - 1) {
            console.log('promise kept');
            promise.next(guesses.clone());
            guesses.clear();
            promise.complete();
            subscription.unsubscribe();
        }
    });
    return promise.toPromise();
}

function displayAnswer() {
    console.log('displaying answer');
    const answerField = document.getElementById('answer');
    answerField.textContent = 'The answer was '+room.question.name;
    revealRoom.removeAttribute('hidden');
}

window.onload = () => {
    initialize();
};
