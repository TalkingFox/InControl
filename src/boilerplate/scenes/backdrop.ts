export class BackDrop extends Phaser.Scene {
  constructor() {
    super({
      key: "BackDrop"
    });
  }

  preload(): void {
  }

  create(): void {
    // connects to peerjs cloud by default
    const peer: PeerJs.Peer = new Peer({});
    console.log(peer);
    peer.on('connection', function(connection: PeerJs.DataConnection) {
      connection.on('data', function(data: string) {
        console.log('Receiving data: ' + data);
      })
    });
  }
}
