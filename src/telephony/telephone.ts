import { Room } from "../models/room";
import { Subject, Observable } from "rxjs";
import { DataMessage } from "../models/message";
import { UserLogin } from "../models/userLogin";
import { User } from "../models/user";
import "peer";

export class Telephone {
    public User: string;

    private peer: PeerJs.Peer;
    private connection: PeerJs.DataConnection;    
    
    constructor(user: string) {
        this.peer = new Peer({});
        this.User = user;
    }

    public connectTo(room: Room): Observable<void> {
        const idGenerated: Subject<string> = new Subject<string>();
        this.peer.on('open', (id: string) => {
            idGenerated.next(id);
            idGenerated.complete();
        });
        const connectionEstablished: Subject<void> = new Subject<void>();
        idGenerated.subscribe(() => {
            const connector = this.peer.connect(room.id, {label: this.User});
            this.connection = connector;
            connector.on('open', () => {
                connectionEstablished.next();
                connectionEstablished.complete();
            });
        });
        return connectionEstablished.asObservable();
    }

    public SendMessage(message: DataMessage): void {
        this.connection.send(message);
    }
}