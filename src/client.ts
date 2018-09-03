import { Point } from "jsqr/dist/locator";
import { Room } from "./models/room";
import { Telephone } from "./telephony/telephone";
import { DrawingBoard } from "./drawing-board";
import { NewDrawing } from "./models/events/new-drawing";
import { Guess } from "./models/events/guess";
import { RoomState } from "./models/events/stateChanged";
import { Subject, Observable } from "rxjs";
import { Scanner } from "./scanner";

let drawingBoard: DrawingBoard;
let telephone: Telephone;
let scanner: Scanner = new Scanner('scanner');

let loadingMessage: HTMLElement;
let userArea: HTMLElement;
let scanningArea: HTMLElement;
let playArea: HTMLElement;
let guessArea: HTMLElement;
let sendDrawing: HTMLElement;

window.onload = () => {
  initialize();
};

function initialize() {
  userArea = document.getElementById("userArea");
  scanningArea = document.getElementById("scanningArea");
  playArea = document.getElementById("playArea");
  guessArea = document.getElementById("guessArea");

  drawingBoard = new DrawingBoard("drawingBoard");
  loadingMessage = document.getElementById("loadingMessage");
  const connect = document.getElementById("connect");
  sendDrawing = document.getElementById("sendDrawing");

  const login = document.getElementById("login");
  login.addEventListener("click", () => {
    const username = document.getElementById('username') as HTMLInputElement;
    if (!username.value) {
        alert('It would be really cool if you entered a name.');
        return;
    }
    telephone = new Telephone(username.value);
    userArea.setAttribute("hidden", "");
    scanningArea.removeAttribute('hidden');
    const subscription = scanner.scanForQrCode().subscribe((room: Room) => {
        joinRoom(room);
        subscription.unsubscribe();
    });
  });

  connect.addEventListener("click", () => {
    const idElement = document.getElementById("connectId") as HTMLInputElement;
    const id = idElement.value;
    joinRoom(new Room(id, "butts"));
  });
}

function joinRoom(room: Room) {
  if (!confirm('Is it ok to join room "' + room.name + '"?')) {
    return;
  }
  console.log("conecting...");
  telephone.connectTo(room).subscribe(() => {
    console.log("connected");
    preparePlayArea();
  });
}

function preparePlayArea() {
  console.log("prepping play area");
  const scanningArea = document.getElementById("scanningArea");
  scanningArea.setAttribute("hidden", "");
  const playArea = document.getElementById("playArea");
  playArea.removeAttribute("hidden");
  waitForClues();
  sendDrawing.addEventListener("click", () => {
    const data = drawingBoard.toDataUrl();
    const message = new NewDrawing(data);
    telephone.SendMessage(message);
    waitForStateChange(RoomState.WaitingForGuesses).subscribe(() => {
      playArea.setAttribute("hidden", "");
      guessArea.removeAttribute("hidden");
      submitFinalGuess();
    });
  });
}

function waitForStateChange(expectedState: RoomState): Observable<void> {
  const waiter = new Subject<void>();
  const subscription = telephone.roomState.subscribe(state => {
    if (state != expectedState) {
      console.log("skipping ", state);
    }
    waiter.next();
    waiter.complete();
  });
  return waiter.asObservable();
}

function waitForClues() {
  console.log("waiting for clues");
  const clueSub = telephone.clues.subscribe((clue: string) => {
    alert('Your clue is: "' + clue + '"');
    clueSub.unsubscribe();
  });
}

function waitForNewRound() {
  console.log("waiting for answer");
}

function submitFinalGuess() {
  guessArea.removeAttribute("hidden");
  const sendGuess = document.getElementById("sendGuess");
  sendGuess.addEventListener("click", () => {
    const guessElement = document.getElementById("guess") as HTMLInputElement;
    const guess = new Guess(guessElement.value);
    telephone.SendMessage(guess);
    waitForNewRound();
  });
}
