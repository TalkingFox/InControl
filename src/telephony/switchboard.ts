import { Observable, Subject } from 'rxjs';
import { DataMessage, DataMessageType } from '../models/events/message';
import "peer";
import { Question } from '../models/question';

export class Switchboard {
    public users: Observable<string>;
    public drawings: Observable<string>;
    public guesses: Observable<string>;

    private drawingQueue: Subject<string>;
    private guessQueue: Subject<string>;
    private userQueue: Subject<string>;
    private connections: PeerJs.DataConnection[];
    private isOpenToNewUsers: boolean = true;
    private peer: PeerJs.Peer;

    constructor() {
        this.guessQueue = new Subject<string>();
        this.guesses = this.guessQueue.asObservable();
        this.drawingQueue = new Subject<string>();
        this.drawings = this.drawingQueue.asObservable();
        this.userQueue = new Subject<string>();
        this.users = this.userQueue.asObservable();
        this.connections = [];
    }

    public dispatchMessage(user: string, message: DataMessage) {
        const matchedUser = this.connections.find((connection: PeerJs.DataConnection) => {
            return connection.label == user;
        });
        console.log('sending message ',message);
        matchedUser.send(JSON.stringify(message));
        console.log('message sent to ',matchedUser);

    }

    public dispatchMessageToAll(message: DataMessage) {
        this.connections.forEach((connection: PeerJs.DataConnection) => {
            connection.send(JSON.stringify(message));
        });
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
    
    public getQuestions(): Observable<Question[]> {
        const http = new XMLHttpRequest();
        const questionSubject = new Subject<Question[]>();
        http.onreadystatechange = () => {
            if (http.readyState == 4 && http.status == 200) {
                const response = JSON.parse(http.response) as Question[];
                questionSubject.next(response);
                questionSubject.complete();
            }
        };
        http.open('GET', './content/data.json', true);
        http.send();
        return questionSubject.asObservable();
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
                case DataMessageType.Guess:
                    this.guessQueue.next(<string>data.body);
                default:
                    console.log(data);
            }

        });
    }
    
}