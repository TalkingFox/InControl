import { Message, DataMessageType } from "./message";

export class StateChanged implements Message<RoomState>
{
    public type: string = DataMessageType.StateChange;
    public body: RoomState;

    constructor(state: RoomState) {
        this.body = state;
    }
}

export enum RoomState {
    GameEnded,
    GiveGuesses,
    MyTurn,
    OtherPlayerSelected,
    RoundEnded,
    ScoreGuesses,
    WaitingForRoundEnd
}