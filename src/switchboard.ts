import {Observable, Subject} from 'rxjs';

export class Switchboard {
    public messages: Observable<string>;
    private messageQueue: Subject<string>;
    private connections: PeerJs.DataConnection[];
    private isOpenToNewUsers: boolean = true;

    constructor() {
        this.messageQueue = new Subject<string>();
        this.messages = this.messageQueue.asObservable();
        this.connections = [];
    }

    public stopAcceptingNewUsers() {
        this.isOpenToNewUsers = false;
    }
    
    public startListening(): Observable<string> {
        const peer: PeerJs.Peer = new Peer({});
        const subject: Subject<string> = new Subject();
        peer.on('open', (id: string) => {
            subject.next(id);
            subject.complete();
        });
        this.registerNewConnections(peer);
        return subject.asObservable();
    }

    private registerNewConnections(peer: PeerJs.Peer) {
        peer.on('connection', (newConnection: PeerJs.DataConnection) => {
            if (!this.isOpenToNewUsers) {
                return;
            }
            this.connections.push(newConnection);
            this.listenForMessages(newConnection);
        });
    }

    private listenForMessages(connection: PeerJs.DataConnection) {
        connection.on('data', (data) => {
            this.messageQueue.next(data);
        });
    }
    
}