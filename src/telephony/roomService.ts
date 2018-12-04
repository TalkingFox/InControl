import { ajax, AjaxResponse } from 'rxjs/ajax';
import { Observable, Subject } from 'rxjs';
import {
    map,
    switchMap,
    first,
    share,
    delay,
    mergeMap,
    tap
} from 'rxjs/operators';
import { environment } from '../environment/environment';
import { NewGuest } from './newGuest';
import { AcceptPlayer } from './acceptPlayer';
import { JoinRoomRequest } from './iot/joinRoomRequest';
import { PlayerOffer } from './playerOffer';
import { IotClient } from './iot/iot-client';
import { Room } from '../models/room';

export class RoomService {
    private iot: IotClient = new IotClient();

    private getHeaders() {
        return {
            'Content-Type': 'application/json'
        };
    }

    public bookRoom(): Observable<string> {
        const endpoint = environment.signalServer + '/rooms';
        const headers = this.getHeaders();
        return ajax.post(endpoint, null, headers).pipe(
            map((response: AjaxResponse) => {
                return response.response;
            })
        );
    }

    public readGuestBook(room: string): Observable<JoinRoomRequest> {
        this.iot.subscribe(room);
        return this.iot.requests;
    }

    public registerGuest(request: AcceptPlayer): void {
        this.iot.publish(request.room, request.answer);
    }

    public requestRoom(room: string): Observable<string> {
        const endpoint = `${environment.signalServer}/rooms/${room}`;
        const headers = this.getHeaders();
        return ajax
            .get(endpoint, headers)
            .pipe(map((data: AjaxResponse) => data.response));
    }

    private getAnswer(request: JoinRoomRequest): Observable<PlayerOffer> {
        const endpoint = `${environment.signalServer}/rooms/${
            request.room
        }/offers/${request.player}`;
        const subject = new Subject<PlayerOffer>();
        ajax.get(endpoint)
            .pipe(
                tap((data: AjaxResponse) => console.log(data)),
                first(
                    (data: AjaxResponse) =>
                        (<PlayerOffer>data.response).answer != undefined
                ),
                map((data: AjaxResponse) => <PlayerOffer>data.response)
            )
            .subscribe((offer: PlayerOffer) => {
                subject.next(offer);
                subject.complete();
            });
        return subject.asObservable();
    }
}
