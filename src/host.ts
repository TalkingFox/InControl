import { Switchboard } from './telephony/switchboard';
import { Room } from './models/room';
import { StateChanged, RoomState } from './models/events/stateChanged';
import { Question } from './models/question';
import { Observable, Subject } from 'rxjs';
import { Util } from './util';
import { PlayerSelected } from './models/events/playerSelected';
import { Guess } from './models/events/guess';
import { TalkativeArray } from './models/talkative-array';
import { DrawingBoard } from './drawing-board';
import { ClueEnvelope } from './models/ClueEnvelope';
import { Player } from './models/player';

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
        createRoom();
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

function createRoom() {
    console.log('creating room');
    initializeWaitingRoom();
}

function playerJoined(user: Player) {
    room.users.push(user.name);
    const userGroup = document.createElement('div');
    const userName = document.createElement('li');
    const avatar = document.createElement('img') as HTMLImageElement;

    avatar.src = user.avatar;
    userName.textContent = user.name;

    userGroup.appendChild(userName);
    userGroup.appendChild(avatar);
    users.appendChild(userGroup);
}

function initializeWaitingRoom() {
	transitionTo('waitingArea');
    switchboard.createRoom().subscribe((roomName: string) => {
        const idHaver = document.getElementById('roomId') as HTMLInputElement;
        idHaver.value = 'id';
        room = new Room('abc', roomName);
        switchboard.players.subscribe((user: Player) => {
            playerJoined(user);
        });
        const startGameOk = document.getElementById('startGame');
        startGameOk.addEventListener('click', () => {
            startGame();
        });
    });
}

function getQuestions(): Promise<Question[]> {
	if (questions) {
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

function takeClues(): ClueEnvelope[] {
	const clues = room.users.map((user: string) => {
		const clue = Util.PopRandomElement(room.question.clues);
        room.usedClues.push(clue);
		return new ClueEnvelope(user, clue);
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
	return new PlayerSelected(player, drawingBoard.toDataUrl());
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
	if (room.cluelessUsers.length === 0) {
		return endGame();
	}
    transitionTo('drawingArea');
    takeClues().map((envelope: ClueEnvelope) => {
        switchboard.dispatchMessage(envelope.player, envelope.clue);
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
    const stateChange = new StateChanged(RoomState.FinalGuess);
    switchboard.dispatchMessageToAll(stateChange);
    waitForGuesses()
        .then((guesses: Guess[]) => displayAnswer());
}

function waitForGuesses(): Promise<Guess[]> {
    if (guesses.length === room.users.length - 1) {
        const resolution = Promise.resolve(guesses.elements.splice(0));
        guesses.clear();
        return resolution;
    }
    const promise = new Subject<Guess[]>();
    const subscription = guesses.Subscribe(() => {
        if (guesses.length === room.users.length - 1) {
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
