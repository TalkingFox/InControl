export interface ConnectRequest {
    room: string;
    player: string;
    offer: string;
    type: string;
}

export type ConnectResponse = ConnectRequest;
export enum ConnectType {
    Answer = 'answer',
    Offer = 'offer'
}