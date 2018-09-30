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
let users: HTMLElement;
let guesses: TalkativeArray<Guess>;
let currentPlayer: HTMLElement;

function initialize() {
    guesses = new TalkativeArray<Guess>();
    drawingBoard = new DrawingBoard({elementId: 'drawingBoard', isReadOnly: true});
    switchboard.guesses.subscribe((guess: Guess) => guesses.Push(guess));
    users = document.getElementById('users');
    
    const replay = document.getElementById('replay');
    replay.addEventListener('click', () => {
        drawingBoard.ClearCanvas();
        startGame();
    });
    replay.addEventListener('click', () => {
        questions = null;
        startGame();
    });
    currentPlayer = document.getElementById('currentPlayer');
    createRoom();
}

function transitionTo(area: string) {    
    const allAreas = document.querySelectorAll('body > div');
    allAreas.forEach((value: Element) => {
        if (value.id == area) {
            value.classList.remove('hidden');
        } else {
            value.classList.add('hidden');
        }
    });
}

function createRoom() {
    transitionTo('waitingArea');
    switchboard.createRoom().subscribe((roomName: string) => {
        room = new Room(roomName);
        const idHaver = document.getElementById('roomId') as HTMLInputElement;
        idHaver.value = roomName;        
        switchboard.players.subscribe((user: Player) => {
            playerJoined(user);
        });
        const startGameOk = document.getElementById('startGame');
        startGameOk.addEventListener('click', () => {
            startGame();
        });
    });
}

function playerJoined(user: Player) {
    console.log('adding: ', user);
    room.users.push(user.name);
    const userGroup = document.createElement('div');
    userGroup.classList.add('player');
    const userName = document.createElement('p');
    const avatar = document.createElement('img') as HTMLImageElement;

    avatar.src = user.avatar;
    userName.textContent = user.name;

    userGroup.appendChild(avatar);
    userGroup.appendChild(userName);
    users.appendChild(userGroup);
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

function selectPlayer(): void {
	Util.Shuffle(room.cluelessUsers);
	const player = Util.PopRandomElement(room.cluelessUsers);
    const selected = new PlayerSelected(player, drawingBoard.toDataUrl());    
    console.log('telling the new playing that it is their turn: ', selected);
    switchboard.dispatchMessageToAll(selected);
    currentPlayer.textContent = player;
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
            console.log('slice: ', room.users);
            takeClues().map((envelope: ClueEnvelope) => {
                console.log('sending new clues');
                switchboard.dispatchMessage(envelope.player, envelope.clue);
            });
            startNextRound();
        });	
}

function startNextRound(): void{
    console.log('starting a new round');
	if (room.cluelessUsers.length === 0) {
        console.log('ending game');
		return endGame();
	}
    transitionTo('drawingArea');    
    console.log('player time');
    selectPlayer();
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
        console.log('got a new guess');
        if (guesses.length === room.users.length - 1) {
            promise.next(guesses.clone());
            guesses.clear();
            promise.complete();
            console.log('promise kept');
            subscription.unsubscribe();
        } else {
            console.log('the fuck?');
            console.log(guesses);
            console.log(room);
        }
    });
    return promise.toPromise();
}

function displayAnswer() {
    console.log('displaying answer');
    const answerField = document.getElementById('answer');
    answerField.textContent = 'The answer was '+room.question.name;
    transitionTo('revealArea');
}

window.onload = () => {
    initialize();
};
