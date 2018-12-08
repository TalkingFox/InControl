import { CreateRoomComponent } from './components/host/createRoomComponent';
import { HostComponent } from './components/host/hostComponent';

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
