import { UserLogin } from "./userLogin";
import { NewDrawing } from "./new-drawing";
import { GiveClue } from "./giveClue";
import { StateChanged } from "./stateChanged";

export interface Message<T> { 
    type: string;
    body: T;
}

export type DataMessage = UserLogin | NewDrawing | GiveClue | StateChanged;

export class DataMessageType {
    public static UserLogin = 'UserLogin';
    public static NewDrawing = 'NewDrawing';
    public static GiveClue = 'GiveClue';
    public static Guess = 'Guess';
    public static StateChange = 'StateChange';
}