import { UserLogin } from "./userLogin";

export interface Message<T> { 
    type: string;
    body: T;
}

export type DataMessage = UserLogin;

export class DataMessageType {
    public static UserLogin = 'UserLogin';
}