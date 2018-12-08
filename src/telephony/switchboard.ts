import { Observable, Subject } from 'rxjs';
import { share } from 'rxjs/operators';
import * as Peer from 'simple-peer';
import { Instance } from 'simple-peer';
import 'simple-peer';
import { DataMessage, DataMessageType } from '../models/events/message';
import { RoomState, StateChanged } from '../models/events/stateChanged';
import { Guess } from '../models/guess';
import { GuessScore } from '../models/guessScore';
import { Player } from '../models/player';
import { IotClient } from './iot/iot-client';
import { ConnectRequest, ConnectResponse, ConnectType } from './iot/joinRoomRequest';
import { RoomService } from './roomService';

export class Switchboard {
    public players: Observable<Player>;
    public drawings: Observable<string>;
    public guesses: Observable<Guess>;
    public drawingUpdates: Observable<string>;
    public scoredGuesses: Observable<GuessScore[]>;

    private drawingQueue: Subject<string>;
    private drawingUpdatesQueue: Subject<string>;
    private guessQueue: Subject<Guess>;
    private playerQueue: Subject<Player>;
    private connections: Map<string, Instance>;
    private isOpenToNewUsers: boolean = true;
    private scoredGuessQueue: Subject<GuessScore[]>;
    private roomService: RoomService;

    constructor() {
        this.roomService = new RoomService();
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
        const observable = this.roomService.bookRoom().pipe(share());
        observable.subscribe((room: string) => {
            console.log('listening for guests');
            this.listenForGuests(room);
        });
        return observable;
        // this.peer = new Peer({
        //    initiator: true,
        //   trickle: false,
        //  config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:global.stun.twilio.com:3478?transport=udp' }] }});
        // this.peer.on('signal', (id: Peer.SignalData) => {
        // });
    }

    private listenForGuests(room: string): void {
        this.roomService.readGuestBook(room).subscribe((request: ConnectRequest) => {
            if (!this.isOpenToNewUsers) {
                console.log('not open anymore...');
                return;
            }
            console.log('new request', request);
            this.registerConnection(request);
        });
    }

    private registerConnection(request: ConnectRequest): void {
        const newPeer = new Peer({
            initiator: false,
            trickle: false,
        });
        console.log('signalling offer...', request);
        newPeer.signal(request.offer);
        newPeer.on('signal', (id: any) => {
            console.log('signalled');
            const acceptance: ConnectResponse = {
                offer: id,
                player: request.player,
                room: request.room,
                type: ConnectType.Answer,
            };
            this.roomService.registerGuest(acceptance);
        });
        newPeer.on('connect', () => {
            console.log('connected');
            this.connections.set(request.player, newPeer);
            this.listenForMessages(newPeer);
        });
    }

    private listenForMessages(connection: Instance) {
        connection.on('data', (message: string) => {
            const data = JSON.parse(message) as DataMessage;
            switch (data.type) {
                case DataMessageType.NewDrawing:
                    this.drawingQueue.next(data.body as string);
                    break;
                case DataMessageType.Guess:
                    this.guessQueue.next(data.body as Guess);
                    break;
                case DataMessageType.UserLogin:
                    const player = data.body as Player;
                    this.playerQueue.next(player);
                    break;
                case DataMessageType.DrawingUpdate:
                    this.drawingUpdatesQueue.next(data.body as string);
                    break;
                case DataMessageType.GuessesScored:
                    this.scoredGuessQueue.next(data.body as GuessScore[]);
                    break;
                default:
                    console.log(data);
            }
        });
    }
}
