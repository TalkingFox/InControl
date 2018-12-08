import { device } from 'aws-iot-device-sdk';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environment/environment';
import { ConnectRequest, ConnectResponse, ConnectType } from './joinRoomRequest';

export class IotClient {
    public requests: Observable<ConnectRequest>;
    public responses: Observable<ConnectResponse>;
    private device: device;
    private decoder: TextDecoder = new TextDecoder('utf-8');

    private requests$: Subject<ConnectRequest>;

    private responses$: Subject<ConnectResponse>;

    constructor() {
        this.requests$ = new Subject<ConnectRequest>();
        this.requests = this.requests$.asObservable();
        this.responses$ = new Subject<ConnectResponse>();
        this.responses = this.responses$.asObservable();

        this.device = new device({
            accessKeyId: environment.accessKey,
            baseReconnectTimeMs: 250,
            clientId: `In-Control-Host-${Math.floor(
                Math.random() * 1000000 + 1,
            )}`,
            host: environment.iotHost,
            maximumReconnectTimeMs: 500,
            protocol: 'wss',
            region: environment.region,
            secretKey: environment.secretKey,
        });
        this.attachEvents();
    }

    public publish(room: string, message: any): void {
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
            const message = this.decoder.decode(payload);
            const data = JSON.parse(message) as ConnectRequest;
            if (data.type === ConnectType.Offer) {
                this.requests$.next(data);
            } else if (data.type === ConnectType.Answer) {
                this.responses$.next(data);
            } else {
                throw new Error('received unknown data type: ' + data.type);
            }
        });

        this.device.on('offline', () => {
            throw new Error('offline');
        });

        this.device.on('error', (err) => {
            throw err;
        });
    }
}
