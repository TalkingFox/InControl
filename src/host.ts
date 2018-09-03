import * as QRious from 'qrious';
import { Switchboard } from "./telephony/switchboard";
import { Room } from "./models/room";

const switchboard: Switchboard = new Switchboard();
let drawingBoard: HTMLCanvasElement;
let drawingBoardContext: CanvasRenderingContext2D;

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
}

function initializeWaitingRoom(roomName: string) {
	console.log('initializing wait room');
	switchboard.startListening().subscribe((id: string)=> {
		console.log('connection open');
		const idHaver = document.getElementById('roomId') as HTMLInputElement;
		idHaver.value = id;
		const room = new Room(id, roomName);
		const qr = new QRious({			
			element: document.getElementById('qrCode'),
			value: JSON.stringify(room)
		});	
		switchboard.users.subscribe((user: string) => {
			userJoined(user);
		});
		const waitingRoom = document.getElementById('waitingRoom');
		waitingRoom.removeAttribute('hidden');
		const drawingRoom = document.getElementById('drawingRoom');
		drawingRoom.removeAttribute('hidden');
		startGame();
	});
}

function startGame() {
	switchboard.drawings.subscribe((dataUrl: string) => {
		console.log('drawing receieved');
		copyToCanvas(dataUrl);
	});
}

// when the page is loaded, create our game instance
window.onload = () => {
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
