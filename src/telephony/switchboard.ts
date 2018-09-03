import { Observable, Subject } from 'rxjs';
import { DataMessage, DataMessageType } from '../models/message';
import "peer";
import { NewDrawing } from '../models/new-drawing';

export class Switchboard {
    public users: Observable<string>;
    public drawings: Observable<string>;

    private drawingQueue: Subject<string>;
    private userQueue: Subject<string>;
    private connections: PeerJs.DataConnection[];
    private isOpenToNewUsers: boolean = true;
    private peer: PeerJs.Peer;

    constructor() {
        this.drawingQueue = new Subject<string>();
        this.drawings = this.drawingQueue.asObservable();
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
            this.registerNewConnections(this.peer);            
            subject.next(id);
            subject.complete();
        });
        return subject.asObservable();
    }   

    private registerNewConnections(peer: PeerJs.Peer) {
        peer.on('connection', (newConnection: PeerJs.DataConnection) => {
            console.log('new connection')
            if (!this.isOpenToNewUsers) {
                return;
            }
            this.userQueue.next(newConnection.label)
            this.connections.push(newConnection);
            this.listenForMessages(newConnection);
        });
    }

    private listenForMessages(connection: PeerJs.DataConnection) {
        connection.on('data', (message: string) => {
            const data = JSON.parse(message) as DataMessage;
            switch (data.type) {
                case DataMessageType.NewDrawing:
                    this.drawingQueue.next(<string>data.body);
                    break;
                default:
                    console.log(data);
            }

        });
    }
    
}