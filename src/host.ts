import { Switchboard } from './telephony/switchboard';
import { Room } from './models/room';
import { StateChanged, RoomState } from './models/events/stateChanged';
import { Question } from './models/question';
import { Observable, Subject } from 'rxjs';
import { Util } from './util';
import { PlayerSelected } from './models/events/playerSelected';
import { Guess } from './models/guess';
import { TalkativeArray } from './models/talkative-array';
import { DrawingBoard } from './drawing-board';
import { ClueEnvelope } from './models/ClueEnvelope';
import { Player } from './models/player';
import { GuessScore } from './models/guessScore';
import { GuessScoreCard } from './models/guessScoreCard';
import { GiveGuesses } from './models/events/giveGuesses';

const switchboard: Switchboard = new Switchboard();
let drawingBoard: DrawingBoard;
let room: Room;
let questions: Question[];
let users: HTMLElement;
let guesses: TalkativeArray<Guess>;
let scoredGuesses: TalkativeArray<GuessScore>;
let currentPlayer: HTMLElement;
let tagline: HTMLElement;
let turnMessage: HTMLElement;
let finalDrawing: HTMLImageElement;

function initialize() {
    guesses = new TalkativeArray<Guess>();
    drawingBoard = new DrawingBoard({elementId: 'drawingBoard', isReadOnly: true});
    switchboard.drawingUpdates.subscribe((dataUrl: string) => {
        console.log('updated');
        drawingBoard.loadDataUrl(dataUrl);
    });
    switchboard.guesses.subscribe((guess: Guess) => guesses.Push(guess));
    users = document.getElementById('users');
    tagline = document.getElementById('tagline');
    turnMessage = document.getElementById('turnMessage');
    finalDrawing = document.getElementById('finalDrawing') as HTMLImageElement;

    const replay = document.getElementById('replay');
    replay.addEventListener('click', () => {
        tagline.classList.remove('glow');
        turnMessage.classList.remove('hidden');
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
    console.log('transitionTo: ', area);
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
		return endGame();
	}
    transitionTo('drawingArea');    
    console.log('player time');
    selectPlayer();
    const subscription = waitForDrawings().subscribe((dataUrl: string) => {
        subscription.unsubscribe();
        drawingBoard.loadDataUrl(dataUrl);
        startNextRound();
    });
}

function endGame() {
    waitForGuesses()
        .then((finalGuesses: Guess[]) => waitForScores(finalGuesses))
        .then((newlyScoredGuesses: GuessScore[]) => displayAnswer(newlyScoredGuesses));
}

function waitForGuesses(): Promise<Guess[]> {
    switchboard.dispatchStateChange(RoomState.GiveGuesses);
    tagline.textContent = "Submit Your Guesses!";
    tagline.classList.add('glow');
    turnMessage.classList.add('hidden');

    if (guesses.length === room.users.length) {
        const resolution = Promise.resolve(guesses.elements.splice(0));
        guesses.clear();
        return resolution;
    }
    const promise = new Subject<Guess[]>();
    const subscription = guesses.Subscribe(() => {
        if (guesses.length === room.users.length) {
            promise.next(guesses.clone());
            guesses.clear();
            promise.complete();
            subscription.unsubscribe();
        }
    });
    return promise.toPromise();
}

function waitForScores(finalGuesses: Guess[]): Promise<GuessScore[]> {
    tagline.textContent = 'Waiting for Your Scores!'
    const guessesMessage = new GiveGuesses(finalGuesses);
    switchboard.dispatchMessageToAll(guessesMessage);
    
    if (scoredGuesses.length === room.users.length) {
        const resolution = Promise.resolve(scoredGuesses.elements.splice(0));
        scoredGuesses.clear();
        return resolution;
    }

    const promise = new Subject<GuessScore[]>();
    const subscription = scoredGuesses.Subscribe(() => {
        if (guesses.length === room.users.length) {
            promise.next(scoredGuesses.clone());
            scoredGuesses.clear();
            promise.complete();
            subscription.unsubscribe();
        }
        return promise.toPromise();
    });
}

function displayAnswer(newlyScoredGuesses: GuessScore[]) {
    const finalGuesses = new Map<string, GuessScoreCard>();
    newlyScoredGuesses.map((guessScore: GuessScore) => {
        if (!finalGuesses.has(guessScore.guess.user)) {
            const newCard = new GuessScoreCard(guessScore.guess);
            finalGuesses.set(guessScore.guess.user, newCard);
        }

        const card = finalGuesses.get(guessScore.guess.user);
        if (guessScore.isFunny) {
            card.funnies++;
        }
        if (guessScore.isLiked) {
            card.likes++;
        }
    });
    const guessesList = document.getElementById('guesses');
    finalGuesses.forEach((scoreCard: GuessScoreCard) => {
        const span = document.createElement('span');
        span.classList.add('clueScore');
        
        const guessElement = document.createElement('p');
        guessElement.textContent = `${scoreCard.guess.user} said: ${scoreCard.guess.guess}`;
        
        const likesElement = document.createElement('p');
        likesElement.classList.add('likes');
        likesElement.textContent = scoreCard.likes.toString();
        
        const funnyElement = document.createElement('p');
        funnyElement.classList.add('funny');
        funnyElement.textContent = scoreCard.funnies.toString();

        span.appendChild(guessElement);
        span.appendChild(likesElement);
        span.appendChild(funnyElement);
        guessesList.appendChild(span);
    });
    const cluesList = document.getElementById('clues');
    room.usedClues.map((clue: string) => {
        const clueElement = document.createElement('p');
        clueElement.textContent = clue;
        cluesList.appendChild(clueElement);
    });
    const answerField = document.getElementById('answer');
    answerField.textContent = room.question.name;
    finalDrawing.src = drawingBoard.toDataUrl();    
    transitionTo('revealArea');
}

window.onload = () => {
    initialize();
};
