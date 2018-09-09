import { Room } from "../models/room";
import { Subject, Observable } from "rxjs";
import { DataMessage, DataMessageType } from "../models/events/message";
import "peer";
import { RoomState } from "../models/events/stateChanged";
import { ClueEnvelope } from "../models/ClueEnvelope";

export class Telephone {
    public user: string;
    public messages: Observable<DataMessage>;
    public clues: Observable<string>;
    public selectedUser: Observable<string>;

    private messageSubject: Subject<DataMessage>;
    private cluesSubject: Subject<string>;
    private peer: PeerJs.Peer;
    private connection: PeerJs.DataConnection;
    private selectedUserSubject: Subject<string>;
    private room: Room;
    
    constructor(user: string) {
        this.user = user;
        this.messageSubject = new Subject<DataMessage>();
        this.messages = this.messageSubject.asObservable();
        this.cluesSubject = new Subject<string>();
        this.clues = this.cluesSubject.asObservable();
        this.selectedUserSubject = new Subject<string>();
        this.selectedUser = this.selectedUserSubject.asObservable();
    }

    public connectTo(room: Room): Observable<void> {
        this.room = room;
        const peer: PeerJs.Peer = new Peer({});
        this.connection = peer.connect(room.id, {label: this.user});
        const established: Subject<void> = new Subject<void>();
        this.connection.on('open', () => {
            console.log('connection established');
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
                    console.log('received state change from host ', data.body);
                    this.room.setRoomState(<RoomState>data.body);
                    break;
                case DataMessageType.PlayerSelected:
                    const selectedPlayer = <string>data.body;
                    const newRoomState = (selectedPlayer == this.user) ? 
                        RoomState.MyTurn : 
                        RoomState.OtherPlayerSelected;
                    console.log("selected", data.body);
                    console.log('state', newRoomState);
                    this.room.setRoomState(newRoomState);
                    this.selectedUserSubject.next(<string>data.body);
                    break;
                default:
                    console.log(data);
            }
        });
    }
}