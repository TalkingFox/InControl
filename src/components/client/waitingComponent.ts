import { Component } from "../component";

export class WaitingComponent extends Component {
    constructor() {
        super();
    }

    public initialize(): void {
        this.transitionTo('waitingArea');
    }
}