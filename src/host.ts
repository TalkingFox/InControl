import { HostComponent } from './components/hostComponent';
import { CreateRoomComponent } from './components/createRoomComponent';

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
