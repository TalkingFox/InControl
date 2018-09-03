import { UserLogin } from "./userLogin";
import { NewDrawing } from "./new-drawing";
import { GiveClue } from "./giveClue";

export interface Message<T> { 
    type: string;
    body: T;
}

export type DataMessage = UserLogin | NewDrawing | GiveClue;

export class DataMessageType {
    public static UserLogin = 'UserLogin';
    public static NewDrawing = 'NewDrawing';
    public static GiveClue = 'GiveClue';
}