import { Component } from '../../core/component';

export class WaitingComponent extends Component {
    constructor() {
        super();
    }

    public initialize(): void {
        this.transitionTo('waitingArea');
    }
}
