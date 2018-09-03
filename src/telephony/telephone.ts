import { Room } from "../models/room";
import { Subject, Observable } from "rxjs";
import { DataMessage, DataMessageType } from "../models/events/message";
import "peer";

export class Telephone {
    public user: string;
    public messages: Observable<DataMessage>;
    public clues: Observable<string>;

    private messageSubject: Subject<DataMessage>;
    private cluesSubject: Subject<string>;
    private peer: PeerJs.Peer;
    private connection: PeerJs.DataConnection;  
    
    constructor(user: string) {
        this.user = user;
        this.messageSubject = new Subject<DataMessage>();
        this.messages = this.messageSubject.asObservable();
        this.cluesSubject = new Subject<string>();
        this.clues = this.cluesSubject.asObservable();
    }

    public connectTo(room: Room): Observable<void> {
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
                default:
                    console.log(data);
            }
        });
    }
}