import { IotResponse } from './iotResponse';

export interface GuestRequest extends IotResponse {
    room: string;
    offer: string;
    player: string;
}
