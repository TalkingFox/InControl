import { ajax, AjaxResponse } from 'rxjs/ajax';
import { Observable, merge } from 'rxjs';
import { map, switchMap, filter, first } from 'rxjs/operators';
import { environment } from '../environment/environment';
import { NewGuest } from './newGuest';
import { AcceptPlayer } from './acceptPlayer';
import { JoinRoomRequest } from './joinRoomRequest';
import { PlayerOffer } from './playerOffer';

export class RoomService {
    public bookRoom(): Observable<string> {
        const endpoint = environment.signalServer + '/rooms';
        return ajax.post(endpoint).pipe(
            map((response: AjaxResponse) => {
                return response.response;
            })
        );
    }

    public getNewGuests(room: string): Observable<NewGuest[]> {
        const endpoint = environment.signalServer + '/rooms/' + room + '/offers';
        return ajax.get(endpoint).pipe(
            map((data: AjaxResponse) => {
                return JSON.parse(data.response);
            })
        );
    }

    public registerGuest(request: AcceptPlayer): Observable<void> {
        const endpoint = `${environment.signalServer}/rooms/${request.room}/offers/${request.player}`;
        return ajax
            .post(endpoint, { answer: request.answer })
            .pipe(map(() => {}));
    }

    public requestRoom(request: JoinRoomRequest): Observable<PlayerOffer> {
        const endpoint = `${environment.signalServer}/rooms/${request.room}/offers`;
        return ajax.post(endpoint, { name: request.player, offer: request.offer })
            .pipe(switchMap(() => this.getAnswer(request)));
            
    }

    private getAnswer(request: JoinRoomRequest): Observable<PlayerOffer> {
        const endpoint = `${environment.signalServer}/rooms/${request.room}/offers/${request.player}`;
        return ajax.get(endpoint).pipe(
            first((data: AjaxResponse) => (<PlayerOffer>JSON.parse(data.response)).answer != undefined),
            map((data: AjaxResponse) => (<PlayerOffer>JSON.parse(data.response))));
    }
}
