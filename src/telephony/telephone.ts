import { Room } from "../models/room";
import { Subject, Observable } from "rxjs";
import { DataMessage, DataMessageType } from "../models/events/message";
import { RoomState } from "../models/events/stateChanged";
import { ClueEnvelope } from "../models/ClueEnvelope";
import { PlayerState } from "../models/events/playerSelected";
import { Player } from "../models/player";
import { PlayerLogin } from "../models/events/playerLogin";
import 'simple-peer';
import * as Peer from 'simple-peer';
import { Instance } from "simple-peer";
import * as SocketIOClient from 'socket.io-client';
import { RoomEvent } from "../models/roomEvents";
import { JoinRoomRequest } from "./joinRoomRequest";

export class Telephone {
    public player: Player;
    public messages: Observable<DataMessage>;
    public clues: Observable<string>;

    private messageSubject: Subject<DataMessage>;
    private cluesSubject: Subject<string>;
    private peer: Instance;
    private room: Room;
    private socket: SocketIOClient.Socket;
    
    constructor(player: Player) {
        this.player = player;
        this.messageSubject = new Subject<DataMessage>();
        this.messages = this.messageSubject.asObservable();
        this.cluesSubject = new Subject<string>();
        this.clues = this.cluesSubject.asObservable();
    }

    public connectTo(room: Room): Observable<void> {
        this.room = room;
        this.peer = new Peer({initiator: true, trickle: false});
        this.peer.on('signal', (id: any) => {
            console.log('signal: ', id);
            const request: JoinRoomRequest = {
                offer: JSON.stringify(id),
                player: this.player.name,
                room: room.name
            };
            console.log(JSON.stringify(request));
            this.socket.emit(RoomEvent.Join, JSON.stringify(request));
            console.log('emitted offer');
        });

        this.socket = SocketIOClient('localhost:8080');
        const donezo = new Subject<void>();
        this.socket.on(RoomEvent.PlayerAccepted, (host: string) => {
            console.log('joined room');            
            console.log('host: ', host);
            this.peer.signal(host);            
        });
        this.peer.on('connected', () => {
            donezo.next();
            donezo.complete();
        });
        return donezo.asObservable();
    }
        
        //peer.connect(room.id, {label: this.player.name});

            /*this.connection.on('open', () => {
            established.next();
            established.complete();
            this.listenForMessages(this.connection);
            const login = new PlayerLogin(this.player);
            this.SendMessage(login);
        });
        })
        const established: Subject<void> = new Subject<void>();
        
        return established.asObservable();*/
    

    public SendMessage(message: DataMessage): void {
        //this.connection.send(JSON.stringify(message));
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