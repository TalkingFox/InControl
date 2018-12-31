import { Observable, Subject } from 'rxjs';
import { Instance } from 'simple-peer';
import * as Peer from 'simple-peer';
import 'simple-peer';
import { Guess } from '../models/event-bodies/guess';
import { PlayerState } from '../models/event-bodies/playerState';
import { DataMessage, DataMessageType } from '../models/events/message';
import { RoomState } from '../models/events/stateChanged';
import { Player } from '../models/player';
import { Room } from '../models/room';
import { FoxConnect } from 'foxconnect';
import { environment } from '../environment/environment';
import { JoinRoomRequest } from 'foxconnect/dist/models/joinRoomRequest';
import { HostResponse } from 'foxconnect/dist/models/hostResponse';

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
    private foxConnect: FoxConnect;

    constructor() {
        this.messageSubject = new Subject<DataMessage>();
        this.messages = this.messageSubject.asObservable();
        this.cluesSubject = new Subject<string>();
        this.clues = this.cluesSubject.asObservable();
        this.guessesSubject = new Subject<Guess[]>();
        this.guesses = this.guessesSubject.asObservable();
        this.foxConnect = new FoxConnect({
            awsAccessKey: environment.accessKey,
            awsIotHost: environment.iotHost,
            awsRegion: environment.region,
            awsSecretKey: environment.secretKey,
            clientId: `${Math.floor(Math.random() * 1000000 + 1)}`,
            signalServer: environment.signalServer
        });
    }

    public connect(room: Room): Observable<void> {
        const donezo = new Subject<void>();
        this.room = room;
        this.peer = new Peer({ initiator: true, trickle: false });
        this.peer.on('signal', (id: any) => {
            const request: JoinRoomRequest = {
                offer: JSON.stringify(id),
                player: this.player.name,
                room: room.name
            };
            this.foxConnect.joinRoom(request).subscribe(
                (response: HostResponse) => {
                    this.peer.signal(response.answer);
                },
                (error: any) => {
                    donezo.error(error);
                }
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

    private listenForMessages(connection: Instance): void {
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
                        selectedPlayer.player === this.player.name
                            ? RoomState.MyTurn
                            : RoomState.OtherPlayerSelected;
                    this.room.setRoomState(newRoomState);
                    this.room.setCanvasData(selectedPlayer.canvasUrl);
                    break;
                default:
                    throw data;
            }
        });
    }
}
