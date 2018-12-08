import { Observable } from 'rxjs';
import { ajax, AjaxResponse } from 'rxjs/ajax';
import { map, mergeMap } from 'rxjs/operators';
import { IotClient } from '../iot/iotClient';
import { environment } from '../../environment/environment';
import { JoinRoomResponse } from '../iot/joinRoomResponse';
import { HostResponse } from '../iot/hostResponse';
import { JoinRoomRequest } from '../../client/models/joinRoomRequest';
import { GuestRequest } from '../iot/clientRequest';
import { AcceptGuestRequest } from '../iot/iotRequest';

export class RoomService {
    private iot: IotClient = new IotClient();

    public createRoom(): Observable<string> {
        const endpoint = environment.signalServer + '/rooms';
        const headers = this.getHeaders();
        return ajax.post(endpoint, null, headers).pipe(
            map((response: AjaxResponse) => {
                return response.response;
            })
        );
    }

    public freeRoom(room: string): void {
        const endpoint = `${environment.signalServer}/rooms/${room}`;
        const headers = this.getHeaders();
        ajax.delete(endpoint, headers).subscribe();
    }

    public readGuestBook(room: string): Observable<GuestRequest> {
        this.iot.subscribeAll(room);
        return this.iot.requests;
    }

    public registerGuest(request: AcceptGuestRequest): void {
        const endpoint = `${environment.signalServer}/rooms/${request.room}/accept`
        const headers = this.getHeaders();
        ajax.post(
            endpoint,
            {
                answer: request.answer,
                playerId: request.guestId
            },
            headers
        ).subscribe();
    }

    public bookRoom(request: JoinRoomRequest): Observable<HostResponse> {
        const endpoint = `${environment.signalServer}/rooms/${request.room}/join`;
        const headers = this.getHeaders();
        return ajax.post(
            endpoint, 
            {
                player: request.player,
                offer: request.offer
            }, 
            headers).pipe(
            mergeMap((response: AjaxResponse) => {
                const joinResponse = <JoinRoomResponse>response.response;
                this.iot.publish(joinResponse.roomTopic, request);
                this.iot.subscribe(joinResponse.roomTopic);
                return this.iot.responses;
            })
        );
    }

    private getHeaders() {
        return {
            'Content-Type': 'application/json'
        };
    }
}
