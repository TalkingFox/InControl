import { JoinRoomRequest } from "../telephony/iot/joinRoomRequest";

export class IotResponse<T> {
    constructor(public topic: string, public body: T){}
}
