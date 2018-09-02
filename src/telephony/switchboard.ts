import { Observable, Subject } from 'rxjs';
import { DataMessage, DataMessageType } from '../models/message';
import { User } from '../models/user';
import "peer";

export class Switchboard {
    public messages: Observable<DataMessage>;
    public users: Observable<string>;

    private messageQueue: Subject<DataMessage>;
    private userQueue: Subject<string>;
    private connections: PeerJs.DataConnection[];
    private isOpenToNewUsers: boolean = true;
    private peer: PeerJs.Peer;

    constructor() {
        this.messageQueue = new Subject<DataMessage>();
        this.messages = this.messageQueue.asObservable();
        this.userQueue = new Subject<string>();
        this.users = this.userQueue.asObservable();
        this.connections = [];
    }

    public stopAcceptingNewUsers() {
        this.isOpenToNewUsers = false;
    }
    
    public startListening(): Observable<string> {
        const subject: Subject<string> = new Subject();
        this.peer = new Peer({});
        this.peer.on('open', (id: string) => {
            console.log('connection open');
            subject.next(id);
            subject.complete();
        });
        this.registerNewConnections(this.peer);
        return subject.asObservable();
    }   

    private registerNewConnections(peer: PeerJs.Peer) {
        peer.on('connection', (newConnection: PeerJs.DataConnection) => {
            if (!this.isOpenToNewUsers) {
                return;
            }
            this.userQueue.next(newConnection.label)
            this.connections.push(newConnection);
            this.listenForMessages(newConnection);
        });
    }

    private listenForMessages(connection: PeerJs.DataConnection) {
        connection.on('data', (data: DataMessage) => {
            switch (data.type) {
                default:
                    console.log(data);
            }

        });
    }
    
}