import { Observable, Subject } from 'rxjs';
import { DataMessage, DataMessageType } from '../models/events/message';
import { Question } from '../models/question';
import { Guess } from '../models/guess';
import { Player } from '../models/player';
import 'simple-peer';
import {Instance} from 'simple-peer';
import * as Peer from 'simple-peer';
import * as SocketIo from 'socket.io-client';
import { RoomEvent } from '../models/roomEvents';
import { PlayerAccepted } from './playerAccepted';
import { environment } from '../environment/environment';
import { RoomState, StateChanged } from '../models/events/stateChanged';
import { GuessScore } from '../models/guessScore';

export class Switchboard {
    public players: Observable<Player>;
    public drawings: Observable<string>;
    public guesses: Observable<Guess>;
    public room: string;
    public drawingUpdates: Observable<string>;
    public scoredGuesses: Observable<GuessScore[]>;

    private drawingQueue: Subject<string>;
    private drawingUpdatesQueue: Subject<string>;
    private guessQueue: Subject<Guess>;
    private playerQueue: Subject<Player>;
    private connections: Map<string,Instance>;
    private isOpenToNewUsers: boolean = true;
    private socket: SocketIOClient.Socket;
    private scoredGuessQueue: Subject<GuessScore[]>;

    constructor() {
        this.guessQueue = new Subject<Guess>();
        this.guesses = this.guessQueue.asObservable();
        this.drawingQueue = new Subject<string>();
        this.drawings = this.drawingQueue.asObservable();
        this.playerQueue = new Subject<Player>();
        this.players = this.playerQueue.asObservable();
        this.connections = new Map<string, Instance>();
        this.drawingUpdatesQueue = new Subject<string>();
        this.drawingUpdates = this.drawingUpdatesQueue.asObservable();
        this.scoredGuessQueue = new Subject<GuessScore[]>();
        this.scoredGuesses = this.scoredGuessQueue.asObservable();
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

    public dispatchStateChange(state: RoomState) {
        const stateChange = new StateChanged(state);
        this.dispatchMessageToAll(stateChange);
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
                    break;
                case DataMessageType.UserLogin:
                    const player = <Player>data.body;
                    this.playerQueue.next(player);
                    break;
                case DataMessageType.DrawingUpdate:
                    this.drawingUpdatesQueue.next(<string>data.body);
                    break;
                case DataMessageType.GuessesScored:
                    this.scoredGuessQueue.next(<GuessScore[]>data.body);
                    break;
                default:
                    console.log(data);
            }

        });
    }
    
}