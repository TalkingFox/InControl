import { Observable, Subject } from 'rxjs';
import { ajax, AjaxResponse } from 'rxjs/ajax';
import {
    map,
    mergeMap,
} from 'rxjs/operators';
import { environment } from '../environment/environment';
import { IotClient } from './iot/iot-client';
import { ConnectRequest, ConnectResponse } from './iot/joinRoomRequest';

export class RoomService {
    private iot: IotClient = new IotClient();

    public bookRoom(): Observable<string> {
        const endpoint = environment.signalServer + '/rooms';
        const headers = this.getHeaders();
        return ajax.post(endpoint, null, headers).pipe(
            map((response: AjaxResponse) => {
                return response.response;
            }),
        );
    }

    public readGuestBook(room: string): Observable<ConnectRequest> {
        this.iot.subscribe(room);
        return this.iot.requests;
    }

    public registerGuest(request: ConnectResponse): void {
        this.iot.publish(request.room, request);
    }

    public requestRoom(request: ConnectRequest): Observable<ConnectResponse> {
        const endpoint = `${environment.signalServer}/rooms/${request.room}`;
        const headers = this.getHeaders();
        return ajax.get(endpoint, headers).pipe(
            mergeMap(() => {
                this.iot.publish(request.room, request);
                this.iot.subscribe(request.room);
                return this.iot.responses;
            }),
        );
    }

    private getHeaders() {
        return {
            'Content-Type': 'application/json',
        };
    }
}
