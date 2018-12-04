import { device } from 'aws-iot-device-sdk';
import { environment } from '../../environment/environment';
import { Observable, Subject } from 'rxjs';
import { JoinRoomRequest } from './joinRoomRequest';

export class IotClient {
    private device: device;
    private decoder: TextDecoder = new TextDecoder('utf-8');

    private _requests: Subject<JoinRoomRequest>;
    public requests: Observable<JoinRoomRequest>;

    constructor() {
        this._requests = new Subject<JoinRoomRequest>();
        this.requests = this._requests.asObservable();

        this.device = new device({
            region: environment.region,
            host: environment.iotHost,
            clientId: `In-Control-Host-${Math.floor(
                Math.random() * 1000000 + 1
            )}`,
            protocol: 'wss',
            baseReconnectTimeMs: 250,
            maximumReconnectTimeMs: 500,
            accessKeyId: environment.accessKey,
            secretKey: environment.secretKey,
        });
        this.attachEvents();
    }

    private attachEvents(): void {
        this.device.on('message', (topic: string, payload: Uint8Array) => {
            const message = this.decoder.decode(payload);
            const data = JSON.parse(message) as JoinRoomRequest;
            if (!data.offer) {
                return;
            }
            this._requests.next(data);
        });
        this.device.on('reconnect', () => {
            console.log('reconnect');
        });

        this.device.on('offline', () => {
            console.log('offline');
        });

        this.device.on('error', err => {
            console.log('iot client error', err);
        });

        this.device.on('message', (topic, message: Uint8Array) => {
            console.log('new message', topic, this.decoder.decode(message));
        });
        this.device.on('connect', () => {
            console.log('connected');
        });
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
}
