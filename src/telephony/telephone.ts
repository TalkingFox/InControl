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
        this.User = user;
    }

    public connectTo(room: Room): Observable<void> {
        const peer: PeerJs.Peer = new Peer({});
        const connection = peer.connect(room.id, {label: this.User});
        const established: Subject<void> = new Subject<void>();
        connection.on('open', () => {
            console.log('connection established');
            established.next();
            established.complete();
        });
        return established.asObservable();
    }

    public SendMessage(message: DataMessage): void {
        this.connection.send(message);
    }
}