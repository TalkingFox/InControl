/// <reference path="../phaser.d.ts"/>

import "phaser";
import "peer";
import { BackDrop } from "./scenes/backdrop";
import { Point } from "../point";

const config: GameConfig = {
	width: 800,
	height: 600,
	type: Phaser.AUTO,
	parent: "game",
	scene: BackDrop,
	physics: {
		default: "arcade",
		arcade: {
			gravity: { y: 0 }
		}
	}
};

let isMouseDown: boolean = false;
let canvasContext: CanvasRenderingContext2D;
let canvas: HTMLCanvasElement;
let lastPosition: Point = new Point(0,0);
let connection: PeerJs.DataConnection;

// game class
export class Game extends Phaser.Game {
	constructor(config: GameConfig) {
		super(config);
	}
}

export function connect() {
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
}

function InitializeCanvas() {
	const canvas: HTMLCanvasElement = document.getElementById('drawingBoard') as HTMLCanvasElement;
	canvasContext = canvas.getContext("2d");
	canvas.addEventListener('mousedown', function (e: MouseEvent) {
		isMouseDown = true;
		const coordinates = GetCurrentCoordinates(e, this);
		SetLastCoordinates(coordinates);
	});
	canvas.addEventListener('touchstart', function (e) {
		isMouseDown = true;
		console.log('touch start');
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




// when the page is loaded, create our game instance
window.onload = () => {
	InitializeCanvas();
	var game = new Game(config);
/*	const connect: HTMLElement = document.getElementById('connect');
	connect.addEventListener('click', (e) => {
		this.connect();
	});

	const send: HTMLElement = document.getElementById('send');
	send.addEventListener('click', (e) => {
		this.sendMessage()
	});*/
};
