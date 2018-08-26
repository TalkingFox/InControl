import "peer";
import { Point } from "./point";
import { Switchboard } from "./switchboard";

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




// when the page is loaded, create our game instance
window.onload = () => {
	InitializeCanvas();
	const clearButton = document.getElementById("clearBoard");
	clearButton.addEventListener('click', function (e) {
		ClearCanvas();
	});
	switchboard.startListening().subscribe((id: string)=> {
		// create QR code
	});
/*	const connect: HTMLElement = document.getElementById('connect');
	connect.addEventListener('click', (e) => {
		this.connect();
	});

	const send: HTMLElement = document.getElementById('send');
	send.addEventListener('click', (e) => {
		this.sendMessage()
	});*/
};
