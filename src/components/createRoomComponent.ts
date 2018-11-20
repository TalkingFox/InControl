import { Component } from './component';
import { HostComponent } from './hostComponent';
import { Room } from '../models/room';
import { Player } from '../models/player';
import { environment } from '../environment/environment';

export class CreateRoomComponent extends Component {
    private users: HTMLElement;

    constructor(private host: HostComponent) {
        super();
        this.users = document.getElementById('users');
    }

    public initialize(): void {
        this.transitionTo('waitingArea');
        this.createRoom();
    }

    private createRoom(): void {
        this.host.switchboard.createRoom().subscribe((roomName: string) => {
            this.host.room = new Room(roomName);
            const idHaver = document.getElementById(
                'roomId'
            ) as HTMLInputElement;
            idHaver.value = roomName;
            this.host.switchboard.players.subscribe((user: Player) => {
                this.playerJoined(user);
            });
            const startGameOk = document.getElementById('startGame');
            startGameOk.addEventListener('click', () => {
                if (
                    this.host.room.users.length <
                    environment.minimumRequiredPlayers
                ) {
                    alert('Please wait until all players have joined. This game requires at least ' +
                            environment.minimumRequiredPlayers +' players.');
                    return;
                }
                this.host.startGame();
            });
        });
    }

    public playerJoined(user: Player) {
        this.host.room.users.push(user.name);
        const userGroup = document.createElement('div');
        userGroup.classList.add('player');
        const userName = document.createElement('p');
        const avatar = document.createElement('img') as HTMLImageElement;

        avatar.src = user.avatar;
        userName.textContent = user.name;

        userGroup.appendChild(avatar);
        userGroup.appendChild(userName);
        this.users.appendChild(userGroup);
    }
}
