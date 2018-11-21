import { Room } from "../models/room";
import { Subject, Observable } from "rxjs";
import { DataMessage, DataMessageType } from "../models/events/message";
import { RoomState } from "../models/events/stateChanged";
import { PlayerState } from "../models/events/playerSelected";
import { Player } from "../models/player";
import 'simple-peer';
import * as Peer from 'simple-peer';
import { Instance } from "simple-peer";
import * as SocketIOClient from 'socket.io-client';
import { RoomEvent } from "../models/roomEvents";
import { JoinRoomRequest } from "./joinRoomRequest";
import { environment } from "../environment/environment";
import { Guess } from "../models/guess";

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
    private socket: SocketIOClient.Socket;
    
    constructor() {
        this.messageSubject = new Subject<DataMessage>();
        this.messages = this.messageSubject.asObservable();
        this.cluesSubject = new Subject<string>();
        this.clues = this.cluesSubject.asObservable();
        this.guessesSubject = new Subject<Guess[]>();
        this.guesses = this.guessesSubject.asObservable();
    }

    public connect(room: Room): Observable<void> {
        this.room = room;
        this.peer = new Peer({initiator: true, trickle: false});
        this.peer.on('signal', (id: any) => {
            const request: JoinRoomRequest = {
                offer: JSON.stringify(id),
                player: this.player.name,
                room: room.name
            };
            this.socket.emit(RoomEvent.Join, JSON.stringify(request));
        });
        this.peer.on('connect', () => {
            donezo.next();
            donezo.complete();
            this.listenForMessages(this.peer);
        });        
        this.socket = SocketIOClient(environment.signalServer);
        const donezo = new Subject<void>();
        this.socket.on(RoomEvent.PlayerAccepted, (host: string) => {
            this.peer.signal(host);            
        });
        this.socket.on(RoomEvent.PlayerNameTaken,() => {
            donezo.error('Sorry, that name is taken. Enter another one.');
            donezo.complete();
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
                    this.cluesSubject.next(<string>data.body);
                    break;
                case DataMessageType.StateChange:                    
                    this.room.setRoomState(<RoomState>data.body);
                    break;
                case DataMessageType.GiveGuesses:
                    this.guessesSubject.next(<Guess[]>data.body);
                    break;
                case DataMessageType.PlayerSelected:
                    const selectedPlayer = <PlayerState>data.body;
                    const newRoomState = (selectedPlayer.player == this.player.name) ? 
                        RoomState.MyTurn : 
                        RoomState.OtherPlayerSelected;
                    this.room.setRoomState(newRoomState);
                    this.room.setCanvasData(selectedPlayer.canvasUrl);
                    break;
                default:
                    console.log(data);
            }
        });
    }
}