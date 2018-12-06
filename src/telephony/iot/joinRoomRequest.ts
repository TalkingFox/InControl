export interface ConnectRequest {
    room: string;
    player: string;
    offer: string;
    type: ConnectType;
}

export type ConnectResponse = ConnectRequest;
export enum ConnectType {
    Answer = 'answer',
    Offer = 'offer'
}