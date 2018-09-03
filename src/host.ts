import * as QRious from 'qrious';
import { Switchboard } from "./telephony/switchboard";
import { Room } from "./models/room";
import { GiveClue } from './models/events/giveClue';

const switchboard: Switchboard = new Switchboard();
let drawingBoard: HTMLCanvasElement;
let drawingBoardContext: CanvasRenderingContext2D;
let room: Room;
let waitingRoom: HTMLElement;

function createRoom(roomName: string) {
	const roomContainer = document.getElementById('roomInformation');
	roomContainer.setAttribute('hidden','');
	initializeWaitingRoom(roomName);
}

function copyToCanvas(dataUrl: string) {
	const image:HTMLImageElement = new Image();
	image.onload = () => {
		drawingBoardContext.drawImage(image, 0, 0);
	};	
	image.src = dataUrl;
}

function userJoined(user: string) {
	console.log(user+' joined!');
	room.users.push(user);

}

function initializeWaitingRoom(roomName: string) {
	console.log('initializing wait room');
	switchboard.startListening().subscribe((id: string)=> {
		console.log('connection open');
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
	waitingRoom.setAttribute('hidden','');
	const drawingRoom = document.getElementById('drawingRoom');
	drawingRoom.removeAttribute('hidden');
	switchboard.stopAcceptingNewUsers();	
	switchboard.drawings.subscribe((dataUrl: string) => {
		console.log('drawing receieved');
		copyToCanvas(dataUrl);
	});
	switchboard.dispatchMessage(room.users[0], new GiveClue('Animal with four legs.'));
}

window.onload = () => {
	waitingRoom = document.getElementById('waitingRoom');
	drawingBoard = document.getElementById('drawingBoard') as HTMLCanvasElement;
	drawingBoardContext = drawingBoard.getContext('2d');
	const roomMaker = document.getElementById('createRoom');
	roomMaker.addEventListener('click', () => {
		const roomElement = document.getElementById('roomName') as HTMLInputElement;
		if (!roomElement.value) {
			alert('Please enter a room name.')
			return;
		}		
		createRoom(roomElement.value);
	});
};
