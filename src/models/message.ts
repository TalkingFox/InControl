import { UserLogin } from "./userLogin";
import { NewDrawing } from "./new-drawing";

export interface Message<T> { 
    type: string;
    body: T;
}

export type DataMessage = UserLogin | NewDrawing;

export class DataMessageType {
    public static UserLogin = 'UserLogin';
    public static NewDrawing = 'NewDrawing';
}