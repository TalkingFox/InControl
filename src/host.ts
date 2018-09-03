import * as QRious from 'qrious';
import { Point } from "./point";
import { Switchboard } from "./telephony/switchboard";
import { Room } from "./models/room";
import { User } from "./models/user";

let isMouseDown: boolean = false;
let canvasContext: CanvasRenderingContext2D;
let canvas: HTMLCanvasElement;
let lastPosition: Point = new Point(0,0);
const switchboard: Switchboard = new Switchboard();


/*export function connect() {
	const idElement = document.getElementById("connectId") as HTMLInputElement;
	const id = idElement.value;
	console.log('connecting with: ' + id);
	const peer: PeerJs.Peer = new Peer({});
	connection = peer.connect(id);
}

export function sendMessage() {
	if (!connection) {
		console.log('Connection is not initialized!');
		return;
	}
	const messageElement = document.getElementById("text") as HTMLInputElement;
	const message = messageElement.value;
	console.log('sending message: ' + message);
	connection.send(message);
}*/

function InitializeCanvas() {
	canvas = document.getElementById('drawingBoard') as HTMLCanvasElement;
	canvasContext = canvas.getContext("2d");
	canvas.addEventListener('mousedown', function (e: MouseEvent) {
		isMouseDown = true;
		const coordinates = GetCurrentCoordinates(e, this);
		SetLastCoordinates(coordinates);
	});
	canvas.addEventListener('touchstart', function (e) {
		isMouseDown = true;
		const coordinates = GetTouchCoordinates(e, this);
		SetLastCoordinates(coordinates);
	});

	canvas.addEventListener('mousemove', function (e) {
		if (isMouseDown) {			
			const coordinates = GetCurrentCoordinates(e, this);
			Draw(coordinates);
		}
	});
	canvas.addEventListener('touchmove', function (e) {
		if (isMouseDown) {
			const coordinates = GetTouchCoordinates(e, this);
			Draw(coordinates);
		}
	});

	canvas.addEventListener('mouseup', function (e) {
		isMouseDown = false;
	});
	canvas.addEventListener('mouseleave', function (e) {
		isMouseDown = false;
	});
	canvas.addEventListener('touchend', function (e) {
		isMouseDown = false;
	});
}

function GetCurrentCoordinates(mouseEvent: MouseEvent, canvasElement: HTMLCanvasElement): Point {
	const x = mouseEvent.clientX - canvasElement.offsetLeft;
	const y = mouseEvent.clientY - canvasElement.offsetTop;
	return new Point(x, y);
}

function GetTouchCoordinates(touchEvent: TouchEvent, canvasElement: HTMLCanvasElement): Point {
	const x = touchEvent.touches[0].clientX - canvasElement.offsetLeft;
	const y = touchEvent.touches[0].clientY - canvasElement.offsetTop;
	return new Point(x, y);
}

function SetLastCoordinates(coordinates: Point){
	lastPosition.x = coordinates.x;
	lastPosition.y = coordinates.y;
}

function Draw(newCoordinates: Point) {
	canvasContext.beginPath();
	canvasContext.moveTo(lastPosition.x, lastPosition.y);
	canvasContext.lineTo(newCoordinates.x, newCoordinates.y);
	canvasContext.strokeStyle = 'black';
	canvasContext.lineWidth = 2;
	canvasContext.lineJoin = 'round';
	canvasContext.lineCap = 'round';
	canvasContext.stroke();
	canvasContext.closePath();

	SetLastCoordinates(newCoordinates);
}

function ClearCanvas() {
	canvasContext.clearRect(0, 0, canvas.width, canvas.height);
}

function createRoom(roomName: string) {
	const roomContainer = document.getElementById('roomInformation');
	roomContainer.setAttribute('hidden','');
	initializeWaitingRoom(roomName);
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
		const drawingBoard = document.getElementById('drawingBoard');
		drawingBoard.removeAttribute('hidden');
	});
}

function startGame() {

}

// when the page is loaded, create our game instance
window.onload = () => {
	const roomMaker = document.getElementById('createRoom');
	roomMaker.addEventListener('click', () => {
		const roomElement = document.getElementById('roomName') as HTMLInputElement;
		if (!roomElement.value) {
			alert('Please enter a room name.')
			return;
		}		
		createRoom(roomElement.value);
	});
	/* InitializeCanvas();
	const clearButton = document.getElementById("clearBoard");
	clearButton.addEventListener('click', function (e) {
		ClearCanvas();
	});*/
	
/*	const connect: HTMLElement = document.getElementById('connect');
	connect.addEventListener('click', (e) => {
		this.connect();
	});

	const send: HTMLElement = document.getElementById('send');
	send.addEventListener('click', (e) => {
		this.sendMessage()
	});*/
};
