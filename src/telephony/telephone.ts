import { Observable, Subject } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as Peer from 'simple-peer';
import 'simple-peer';
import { Instance } from 'simple-peer';
import { DataMessage, DataMessageType } from '../models/events/message';
import { PlayerState } from '../models/events/playerSelected';
import { RoomState } from '../models/events/stateChanged';
import { Guess } from '../models/guess';
import { Player } from '../models/player';
import { Room } from '../models/room';
import { IotClient } from './iot/iot-client';
import { ConnectRequest, ConnectResponse, ConnectType } from './iot/joinRoomRequest';
import { PlayerOffer } from './playerOffer';
import { RoomService } from './roomService';

export class Telephone {
    public player: Player;
    public messages: Observable<DataMessage>;
    public clues: Observable<string>;
    public guesses: Observable<Guess[]>;

    private messageSubject: Subject<DataMessage>;
    private cluesSubject: Subject<string>;
    private guessesSubject: Subject<Guess[]>;
    private peer: Instance;
    private room: Room;
    private roomService: RoomService;
    private iot: IotClient;

    constructor() {
        this.messageSubject = new Subject<DataMessage>();
        this.messages = this.messageSubject.asObservable();
        this.cluesSubject = new Subject<string>();
        this.clues = this.cluesSubject.asObservable();
        this.guessesSubject = new Subject<Guess[]>();
        this.guesses = this.guessesSubject.asObservable();
        this.roomService = new RoomService();
    }

    public connect(room: Room): Observable<void> {
        const donezo = new Subject<void>();
        this.room = room;
        this.peer = new Peer({ initiator: true, trickle: false });
        this.peer.on('signal', (id: any) => {
            console.log('signal');
            const request: ConnectRequest = {
                offer: JSON.stringify(id),
                player: this.player.name,
                room: room.name,
                type: ConnectType.Offer,
            };
            this.roomService.requestRoom(request).subscribe(
                (response: ConnectResponse) => {
                    console.log('got answer');
                    this.peer.signal(response.offer);
                },
                (error: any) => donezo.error(error),
            );
        });
        this.peer.on('connect', () => {
            donezo.next();
            donezo.complete();
            this.listenForMessages(this.peer);
        });
        return donezo.asObservable();
    }

    public SendMessage(message: DataMessage): void {
        this.peer.send(JSON.stringify(message));
    }

    private listenForMessages(connection: Instance) {
        connection.on('data', (message: string) => {
            const data = JSON.parse(message) as DataMessage;
            switch (data.type) {
                case DataMessageType.GiveClue:
                    this.cluesSubject.next(data.body as string);
                    break;
                case DataMessageType.StateChange:
                    this.room.setRoomState(data.body as RoomState);
                    break;
                case DataMessageType.GiveGuesses:
                    this.guessesSubject.next(data.body as Guess[]);
                    break;
                case DataMessageType.PlayerSelected:
                    const selectedPlayer = data.body as PlayerState;
                    const newRoomState =
                        selectedPlayer.player == this.player.name
                            ? RoomState.MyTurn
                            : RoomState.OtherPlayerSelected;
                    this.room.setRoomState(newRoomState);
                    this.room.setCanvasData(selectedPlayer.canvasUrl);
                    break;
                default:
                    console.log(data);
            }
        });
    }
}
