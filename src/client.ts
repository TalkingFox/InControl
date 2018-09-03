import jsQR, { QRCode } from 'jsqr';
import { Point } from 'jsqr/dist/locator';
import { Room } from './models/room';
import { Switchboard } from './telephony/switchboard';
import { Telephone } from './telephony/telephone';


window.onload = () => {
    const telephone: Telephone = new Telephone('tacoman');

    const video = document.createElement('video');
    const canvasElement = document.getElementById('scanner') as HTMLCanvasElement;
    const canvasContext = canvasElement.getContext('2d');
    const loadingMessage = document.getElementById('loadingMessage');
    const outputContainer = document.getElementById('output');
    const outputMessage = document.getElementById('outputMessage');
    const connect = document.getElementById('connect');
    connect.addEventListener('click', () =>{
        const idElement = document.getElementById('connectId') as HTMLInputElement;
        const id = idElement.value;
        console.log('attempting to login to id '+id);
        // joinRoom(new Room(id, 'butts'));
        //straightConnect(id);
        telephone.connectTo(new Room(id, 'butts'));
    });

    function analyzeFrame() {
        loadingMessage.innerText = 'Loading video...';
        if (video.readyState !== video.HAVE_ENOUGH_DATA) {
            return requestAnimationFrame(analyzeFrame);
        }

        loadingMessage.hidden = true;
        canvasElement.hidden = false;
        outputContainer.hidden = false;

        canvasElement.height = video.videoHeight;
        canvasElement.width = video.videoWidth;
        canvasContext.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
        const imageData = canvasContext.getImageData(0, 0, canvasElement.width, canvasElement.height);
        const code: QRCode = jsQR(imageData.data, imageData.width, imageData.height);
        if (!code) {
            return requestAnimationFrame(analyzeFrame);
        }

        drawLine(code.location.topLeftCorner, code.location.topRightCorner);
        drawLine(code.location.topRightCorner, code.location.bottomRightCorner);
        drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner);
        drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner);
        outputMessage.innerText = code.data;
        video.pause();      
        const room = JSON.parse(code.data) as Room;
        joinRoom(room);
    }

    function drawLine(start: Point, end: Point) {
        canvasContext.beginPath();
        canvasContext.moveTo(start.x, start.y);
        canvasContext.lineTo(end.x, end.y);
        canvasContext.lineWidth = 4;
        canvasContext.strokeStyle = 'yellow';
        canvasContext.stroke();
    }

    function joinRoom(room: Room) {
        if (!confirm('Is it ok to join room "'+room.name+'"?')) {
            console.log('did not join room');
            return;
        }
        console.log('attempting to join room');
        telephone.connectTo(room).subscribe(() => {
            alert('connected to room');
        });   
    }

    const mediaConstraints: MediaStreamConstraints = {
        video: {
            facingMode: 'environment'
        }
    };
    // use facingMode: environment to get front camera on phones
    navigator.mediaDevices.getUserMedia(mediaConstraints)
    .then((stream: MediaStream) => {
        video.srcObject = stream;
        // required for ios safari
        video.setAttribute('playsinline', 'true');
        video.play();
        requestAnimationFrame(analyzeFrame);
    });
}