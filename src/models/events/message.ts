import { sentDrawing } from "./sentDrawing";
import { GiveClue } from "./giveClue";
import { StateChanged } from "./stateChanged";
import { PlayerSelected } from "./playerSelected";
import { SendGuess } from "./guess";

export interface Message<T> { 
    type: string;
    body: T;
}

export type DataMessage = sentDrawing | GiveClue 
            | StateChanged | PlayerSelected
            | SendGuess

export class DataMessageType {
    public static UserLogin = 'UserLogin';
    public static NewDrawing = 'NewDrawing';
    public static GiveClue = 'GiveClue';
    public static Guess = 'Guess';
    public static StateChange = 'StateChange';
    public static PlayerSelected = 'UserSelected;'
}