import { Guess } from './models/guess';
import { TalkativeArray } from './models/talkative-array';
import { HostComponent } from './components/hostComponent';
import { CreateRoomComponent } from './components/createRoomComponent';

let guesses: TalkativeArray<Guess>;
let hostComponent: HostComponent;
let createRoomComponent: CreateRoomComponent;

function initialize() {
    hostComponent = new HostComponent();
    hostComponent.initialize();    
    createRoomComponent = new CreateRoomComponent(hostComponent);
    createRoomComponent.initialize();
}

window.onload = () => {
    initialize();
};
