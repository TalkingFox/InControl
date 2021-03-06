import { Component } from '../../core/component';
import { environment } from '../../environment/environment';
import { Player } from '../../models/player';
import { Room } from '../../models/room';
import { HostComponent } from './hostComponent';
import { FoxConnect } from 'foxconnect';

export class CreateRoomComponent extends Component {
    private users: HTMLElement;
    private foxConnect: FoxConnect;

    constructor(private host: HostComponent) {
        super();
        this.users = document.getElementById('users');
        this.foxConnect = new FoxConnect({
            awsAccessKey: environment.accessKey,
            awsIotHost: environment.iotHost,
            awsRegion: environment.region,
            awsSecretKey: environment.secretKey,
            clientId: `${Math.floor(Math.random() * 1000000 + 1)}`,
            signalServer: environment.signalServer
        });
    }

    public initialize(): void {
        this.transitionTo('waitingArea');
        this.createRoom();
    }

    public playerJoined(user: Player): void {
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
                            environment.minimumRequiredPlayers + ' players.');
                    return;
                }
                this.host.startGame();
                this.foxConnect.freeRoom(roomName);
            });
        });
    }
}
