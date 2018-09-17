import { Observable, Subject } from 'rxjs';
import { DataMessage, DataMessageType } from '../models/events/message';
import { Question } from '../models/question';
import { Guess } from '../models/events/guess';
import { Player } from '../models/player';
import 'simple-peer';
import {Instance, SimplePeerData} from 'simple-peer';
import * as Peer from 'simple-peer';
import * as SocketIo from 'socket.io-client';
import { RoomEvent } from '../models/roomEvents';

export class Switchboard {
    public players: Observable<Player>;
    public drawings: Observable<string>;
    public guesses: Observable<Guess>;

    private drawingQueue: Subject<string>;
    private guessQueue: Subject<Guess>;
    private playerQueue: Subject<Player>;
    private connections: Map<string,Instance>;
    private isOpenToNewUsers: boolean = true;
    private peer: Instance;
    private socket: SocketIOClient.Socket;

    constructor() {
        this.guessQueue = new Subject<Guess>();
        this.guesses = this.guessQueue.asObservable();
        this.drawingQueue = new Subject<string>();
        this.drawings = this.drawingQueue.asObservable();
        this.playerQueue = new Subject<Player>();
        this.players = this.playerQueue.asObservable();
        this.connections = new Map<string, Instance>();
    }

    public dispatchMessage(user: string, message: DataMessage) {
        const matchedUser = this.connections.get(user);
        matchedUser.send(JSON.stringify(message));

    }

    public dispatchMessageToAll(message: DataMessage) {
        this.connections.forEach((connection: Instance) => {
            connection.send(JSON.stringify(message));
        });
    }

    public stopAcceptingNewUsers() {
        this.isOpenToNewUsers = false;
    }
    
    public createRoom(): Observable<string> {
        console.log('switchboard creating room');
        const subject: Subject<string> = new Subject();
        this.peer = new Peer({
            initiator: true,
            trickle: false,
            config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:global.stun.twilio.com:3478?transport=udp' }] }});
        this.peer.on('signal', (id: Peer.SignalData) => {
            console.log('signal created: ', id);
            this.socket = SocketIo('localhost:8080');
            this.socket.on(RoomEvent.RoomCreated, (room: string) => {
                console.log('room created: ', room);
                this.registerNewConnections(this.peer);  
                subject.next(room);
                subject.complete();                
            });            
            this.socket.emit(RoomEvent.Create, JSON.stringify(id));            
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

    private registerNewConnections(peer: Instance) {
        this.socket.on(RoomEvent.PlayerJoined, (offer: string) => {
            console.log('player joined');
            if (!this.isOpenToNewUsers) {
                return;
            }
            this.peer.signal(JSON.parse(offer));
            this.peer.on('connect', () => {
                console.log('connection succeeded!');
            });
            //this.connections.set('abc', newConnection);
            //this.listenForMessages(newConnection);
        });
    }

    private listenForMessages(connection: Instance) {
        connection.on('data', (message: string) => {
            const data = JSON.parse(message) as DataMessage;
            switch (data.type) {
                case DataMessageType.NewDrawing:
                    this.drawingQueue.next(<string>data.body);
                    break;
                case DataMessageType.Guess:
                    this.guessQueue.next(<Guess>data.body);
                case DataMessageType.UserLogin:
                    this.playerQueue.next(<Player>data.body);
                    break;
                default:
                    console.log(data);
            }

        });
    }
    
}