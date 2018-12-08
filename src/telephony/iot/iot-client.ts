import { device } from 'aws-iot-device-sdk';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environment/environment';
import { ConnectRequest, ConnectResponse, ConnectType } from './joinRoomRequest';

export class IotClient {
    public requests: Observable<ConnectRequest>;
    public responses: Observable<ConnectResponse>;
    private device: device;
    private decoder: TextDecoder = new TextDecoder('utf-8');

    private _requests: Subject<ConnectRequest>;

    private _responses: Subject<ConnectResponse>;

    constructor() {
        this._requests = new Subject<ConnectRequest>();
        this.requests = this._requests.asObservable();
        this._responses = new Subject<ConnectResponse>();
        this.responses = this._responses.asObservable();

        this.device = new device({
            region: environment.region,
            host: environment.iotHost,
            clientId: `In-Control-Host-${Math.floor(
                Math.random() * 1000000 + 1,
            )}`,
            protocol: 'wss',
            baseReconnectTimeMs: 250,
            maximumReconnectTimeMs: 500,
            accessKeyId: environment.accessKey,
            secretKey: environment.secretKey,
        });
        this.attachEvents();
    }

    public publish(room: string, message: any): void {
        console.log('publishing', room, message);
        this.device.publish('rooms/' + room, JSON.stringify(message));
    }

    public subscribe(room: string): void {
        this.device.subscribe('rooms/' + room);
    }

    public subscribeAll(room: string): void {
        this.device.subscribe('rooms/' + room + '/#');
    }

    private attachEvents(): void {
        this.device.on('message', (topic: string, payload: Uint8Array) => {
            console.log('new message', topic, this.decoder.decode(payload));
            const message = this.decoder.decode(payload);
            const data = JSON.parse(message) as ConnectRequest;
            console.log(data);
            if (data.type === ConnectType.Offer) {
                this._requests.next(data);
            } else if (data.type === ConnectType.Answer) {
                this._responses.next(data);
            } else {
                console.log('twerent neither');
            }
        });
        this.device.on('reconnect', () => {
            console.log('reconnect');
        });

        this.device.on('offline', () => {
            console.log('offline');
        });

        this.device.on('error', (err) => {
            console.log('iot client error', err);
        });

        this.device.on('connect', () => {
            console.log('connected');
        });
    }
}
