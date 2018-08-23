/// <reference path="../phaser.d.ts"/>

import "phaser";
import "peer";
import { BackDrop } from "./scenes/backdrop";

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

let connection: PeerJs.DataConnection;

// game class
export class Game extends Phaser.Game {
  constructor(config: GameConfig) {
    super(config);    
  }
}

export function connect(){
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
  console.log('sending message: '+message);
  connection.send(message);
}


// when the page is loaded, create our game instance
window.onload = () => {
  var game = new Game(config);
  const connect: HTMLElement = document.getElementById('connect');
  connect.addEventListener('click', (e) => {
    this.connect();
  });

  const send: HTMLElement = document.getElementById('send');
  send.addEventListener('click', (e) => {
    this.sendMessage()
  });
};
