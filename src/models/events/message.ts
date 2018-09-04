import { sentDrawing } from "./sentDrawing";
import { GiveClue } from "./giveClue";
import { StateChanged } from "./stateChanged";
import { UserSelected } from "./userSelected";

export interface Message<T> { 
    type: string;
    body: T;
}

export type DataMessage = sentDrawing | GiveClue | StateChanged | UserSelected;

export class DataMessageType {
    public static UserLogin = 'UserLogin';
    public static NewDrawing = 'NewDrawing';
    public static GiveClue = 'GiveClue';
    public static Guess = 'Guess';
    public static StateChange = 'StateChange';
    public static UserSelected = 'UserSelected;'
}