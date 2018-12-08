import { Observable, Subject } from 'rxjs';
import { share } from 'rxjs/operators';
import * as Peer from 'simple-peer';
import { Instance } from 'simple-peer';
import 'simple-peer';
import { GuestRequest } from '../core/iot/clientRequest';
import { AcceptGuestRequest } from '../core/iot/iotRequest';
import { RoomService } from '../core/services/roomService';
import { Guess } from '../models/event-bodies/guess';
import { DataMessage, DataMessageType } from '../models/events/message';
import { RoomState, StateChanged } from '../models/events/stateChanged';
import { GuessScore } from '../models/guessScore';
import { Player } from '../models/player';

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

    public dispatchMessage(user: string, message: DataMessage): void {
        const matchedUser = this.connections.get(user);
        matchedUser.send(JSON.stringify(message));
    }

    public dispatchMessageToAll(message: DataMessage): void {
        this.connections.forEach((connection: Instance) => {
            connection.send(JSON.stringify(message));
        });
    }

    public dispatchStateChange(state: RoomState): void {
        const stateChange = new StateChanged(state);
        this.dispatchMessageToAll(stateChange);
    }

    public stopAcceptingNewUsers(): void {
        this.isOpenToNewUsers = false;
    }

    public createRoom(): Observable<string> {
        const observable = this.roomService.createRoom().pipe(share());
        observable.subscribe((room: string) => {
            this.listenForGuests(room);
        });
        return observable;
    }

    private listenForGuests(room: string): void {
        const subscription = this.roomService
            .readGuestBook(room)
            .subscribe((request: GuestRequest) => {
                if (!this.isOpenToNewUsers) {
                    subscription.unsubscribe();
                    return;
                }
                this.registerConnection(request);
            });
    }

    private registerConnection(request: GuestRequest): void {
        const newPeer = new Peer({
            initiator: false,
            trickle: false
        });
        newPeer.signal(request.offer);
        newPeer.on('signal', (id: any) => {
            const acceptance: AcceptGuestRequest = {
                answer: id,
                guestId: request.id,
                room: request.room
            };
            this.roomService.registerGuest(acceptance);
        });
        newPeer.on('connect', () => {
            this.connections.set(request.player, newPeer);
            this.listenForMessages(newPeer);
        });
    }

    private listenForMessages(connection: Instance): void {
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
                    throw data;
            }
        });
    }
}
