import { CreateRoomComponent } from './host/components/createRoomComponent';
import { HostComponent } from './host/components/hostComponent';

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
