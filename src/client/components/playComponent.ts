import { Component } from '../../core/component';

export class PlayComponent extends Component {
    constructor() {
        super();
    }

    public initialize(): void {
        this.transitionTo('playArea');
    }
}
