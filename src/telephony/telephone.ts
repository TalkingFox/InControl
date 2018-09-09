import { Room } from "../models/room";
import { Subject, Observable } from "rxjs";
import { DataMessage, DataMessageType } from "../models/events/message";
import "peer";
import { RoomState } from "../models/events/stateChanged";
import { ClueEnvelope } from "../models/ClueEnvelope";
import { PlayerState } from "../models/events/playerSelected";

export class Telephone {
    public user: string;
    public messages: Observable<DataMessage>;
    public clues: Observable<string>;

    private messageSubject: Subject<DataMessage>;
    private cluesSubject: Subject<string>;
    private peer: PeerJs.Peer;
    private connection: PeerJs.DataConnection;
    private room: Room;
    
    constructor(user: string) {
        this.user = user;
        this.messageSubject = new Subject<DataMessage>();
        this.messages = this.messageSubject.asObservable();
        this.cluesSubject = new Subject<string>();
        this.clues = this.cluesSubject.asObservable();
    }

    public connectTo(room: Room): Observable<void> {
        this.room = room;
        const peer: PeerJs.Peer = new Peer({});
        this.connection = peer.connect(room.id, {label: this.user});
        const established: Subject<void> = new Subject<void>();
        this.connection.on('open', () => {
            established.next();
            established.complete();
            this.listenForMessages(this.connection);
        });
        return established.asObservable();
    }

    public SendMessage(message: DataMessage): void {
        this.connection.send(JSON.stringify(message));
    }

    private listenForMessages(connection: PeerJs.DataConnection) {
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
                    const newRoomState = (selectedPlayer.player == this.user) ? 
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