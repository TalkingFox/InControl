import { Message, DataMessage, DataMessageType } from './message';
import { User } from '../user';

export class UserLogin implements Message<User> {
    public type: string = DataMessageType.UserLogin;
    public body: User;

    constructor(name: string) {
        this.body = new User(name);
    }
}