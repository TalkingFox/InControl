import { Observable, Subject } from 'rxjs';
import { DataMessage, DataMessageType } from '../models/events/message';
import { Question } from '../models/question';
import { Guess } from '../models/events/guess';
import { Player } from '../models/player';
import 'simple-peer';
import {Instance} from 'simple-peer';
import * as Peer from 'simple-peer';
import * as SocketIo from 'socket.io-client';
import { RoomEvent } from '../models/roomEvents';
import { PlayerAccepted } from './playerAccepted';
import { environment } from '../environment/environment';

export class Switchboard {
    public players: Observable<Player>;
    public drawings: Observable<string>;
    public guesses: Observable<Guess>;
    public room: string;

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
        const subject: Subject<string> = new Subject();
        this.socket = SocketIo(environment.signalServer);
            this.socket.on(RoomEvent.RoomCreated, (room: string) => {
                this.registerNewConnections();  
                subject.next(room);
                subject.complete();  
                this.room = room;              
            });
        this.socket.emit(RoomEvent.Create);
        return subject.asObservable();        
        //this.peer = new Peer({
        //    initiator: true,
         //   trickle: false,
          //  config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:global.stun.twilio.com:3478?transport=udp' }] }});
        //this.peer.on('signal', (id: Peer.SignalData) => {
            
        //});
                        
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

    private registerNewConnections() {
        this.socket.on(RoomEvent.PlayerJoined, (request: string) => {
            const joinRequest: {room: string, player: string, offer: string} = JSON.parse(request);
            const newPeer = new Peer({initiator: false, trickle: false});
            newPeer.signal(JSON.parse(joinRequest.offer));
            newPeer.on('signal', (id: any) => {
                const acceptance: PlayerAccepted = {
                    hostOffer: id,
                    player: joinRequest.player,
                    room: this.room
                };
                this.socket.emit(RoomEvent.PlayerAccepted, JSON.stringify(acceptance));
            });
            newPeer.on('connect', () =>{
                console.log('player connected');
                this.connections.set(joinRequest.player, newPeer);
                this.listenForMessages(newPeer);
            });            
            if (!this.isOpenToNewUsers) {
                return;
            }
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
                    const player = <Player>data.body;
                    this.playerQueue.next(player);
                    break;
                default:
                    console.log(data);
            }

        });
    }
    
}