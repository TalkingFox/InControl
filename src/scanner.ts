import jsQR, {QRCode} from 'jsqr';
import { Point } from './point';
import { Room } from './models/room';
import { Subject, Observable } from 'rxjs';

export class Scanner {
    private readonly mediaConstraints: MediaStreamConstraints = {
        video: {
            facingMode: 'environment'
    }};
    
    private video: HTMLVideoElement;
    private scanner: HTMLCanvasElement;
    private scannerContext: CanvasRenderingContext2D;

    constructor(private elementId: string) {
        this.video = document.createElement('video');
    }

    public scanForQrCode(): Promise<Room> {
        const scanSuccessful = new Subject<Room>();
        this.scanner = document.getElementById(this.elementId) as HTMLCanvasElement;
        this.scannerContext = this.scanner.getContext('2d');
        // use facingMode: environment to get front camera on phones
        navigator.mediaDevices.getUserMedia(this.mediaConstraints)
        .then((stream: MediaStream) => {
            this.video.srcObject = stream;
            // required for ios safari
            this.video.setAttribute('playsinline', 'true');
            this.video.play();
            return requestAnimationFrame(() => this.analyzeFrame(scanSuccessful));
        });
        return scanSuccessful.toPromise();
    }

        private analyzeFrame(subject: Subject<Room>): number {
        if (this.video.readyState !== this.video.HAVE_ENOUGH_DATA) {
            return requestAnimationFrame(() => this.analyzeFrame(subject));
        }
    
        this.scanner.height = this.video.videoHeight;
        this.scanner.width = this.video.videoWidth;
        this.scannerContext.drawImage(this.video, 0, 0, this.scanner.width, this.scanner.height);
        const imageData = this.scannerContext.getImageData(0, 0, this.scanner.width, this.scanner.height);
        const code: QRCode = jsQR(imageData.data, imageData.width, imageData.height);
        if (!code) {
            return requestAnimationFrame(() => this.analyzeFrame(subject));
        }
    
        this.drawLine(code.location.topLeftCorner, code.location.topRightCorner);
        this.drawLine(code.location.topRightCorner, code.location.bottomRightCorner);
        this.drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner);
        this.drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner);
        const streams = <MediaStream>this.video.srcObject;
        streams.getTracks().forEach((track) => {
            track.stop();
        });
        try {
            const room = JSON.parse(code.data) as Room;
            subject.next(room);
            subject.complete();  
        } catch (error) {
            subject.error('Failed to parse QR code. Received '+code.data);
            subject.complete();
        }
        
    }

    private drawLine(start: Point, end: Point): void {
        this.scannerContext.beginPath();
        this.scannerContext.moveTo(start.x, start.y);
        this.scannerContext.lineTo(end.x, end.y);
        this.scannerContext.lineWidth = 4;
        this.scannerContext.strokeStyle = 'yellow';
        this.scannerContext.stroke();
    }
}