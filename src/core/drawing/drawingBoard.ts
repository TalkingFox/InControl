import { Observable, Subject } from 'rxjs';
import { DrawingBoardSettings } from './drawingBoardSettings';
import { Point } from './point';

export class DrawingBoard {
    public mouseUp: Observable<void>;

    private mouseUpSubject: Subject<void>;
    private isMouseDown: boolean = false;
    private canvas: HTMLCanvasElement;
    private canvasContext: CanvasRenderingContext2D;
    private lastPosition: Point = new Point(0, 0);

    public constructor(settings: DrawingBoardSettings) {
        this.mouseUpSubject = new Subject<void>();
        this.mouseUp = this.mouseUpSubject.asObservable();
        this.canvas = document.getElementById(settings.elementId) as HTMLCanvasElement;
        this.canvasContext = this.canvas.getContext('2d');
        this.canvas.width = 500;
        this.canvas.height = 500;
        if (!settings.isReadOnly) {
            this.setEvents(this.canvas);
        }
    }

    public ClearCanvas(): void {
        this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    public toDataUrl(): string {
        return this.canvas.toDataURL();
    }

    public loadDataUrl(url: string): void {
        const image: HTMLImageElement = new Image();
        image.onload = () => {
            this.canvasContext.drawImage(image, 0, 0);
        };
        image.src = url;
    }

    private setEvents(canvas: HTMLCanvasElement): void {
        canvas.addEventListener('mousedown', (e: MouseEvent) => {
            this.isMouseDown = true;
            const coordinates = this.GetCurrentCoordinates(e, canvas);
            this.SetLastCoordinates(coordinates);
            this.Dot(coordinates);
        });

        canvas.addEventListener('touchstart', (e) => {
            this.isMouseDown = true;
            const coordinates = this.GetTouchCoordinates(e, canvas);
            this.SetLastCoordinates(coordinates);
            this.Dot(coordinates);
        });

        canvas.addEventListener('mousemove', (e) => {
            if (this.isMouseDown) {
                const coordinates = this.GetCurrentCoordinates(e, canvas);
                this.Draw(coordinates);
            }
        });
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault(); // don't scroll
            if (this.isMouseDown) {
                const coordinates = this.GetTouchCoordinates(e, canvas);
                this.Draw(coordinates);
            }
        });

        canvas.addEventListener('mouseup', (e) => {
            this.isMouseDown = false;
            this.mouseUpSubject.next();
        });
        canvas.addEventListener('mouseleave', (e) => {
            this.isMouseDown = false;
        });
        canvas.addEventListener('touchend', (e) => {
            this.isMouseDown = false;
            this.mouseUpSubject.next();
        });
    }

    private GetCurrentCoordinates(mouseEvent: MouseEvent, canvasElement: HTMLCanvasElement): Point {
        const rect = canvasElement.getBoundingClientRect();
        const x = (mouseEvent.clientX - rect.left) / (rect.right - rect.left) * canvasElement.width;
        const y = (mouseEvent.clientY - rect.top) / (rect.bottom - rect.top) * canvasElement.height;
        return new Point(x, y);
    }

    private GetTouchCoordinates(touchEvent: TouchEvent, canvasElement: HTMLCanvasElement): Point {
        const rect = canvasElement.getBoundingClientRect();
        const x = (touchEvent.touches[0].clientX - rect.left) / (rect.right - rect.left) * canvasElement.width;
        const y = (touchEvent.touches[0].clientY - rect.top) / (rect.bottom - rect.top) * canvasElement.height;
        return new Point(x, y);
    }

    private SetLastCoordinates(coordinates: Point): void {
        this.lastPosition.x = coordinates.x;
        this.lastPosition.y = coordinates.y;
    }

    private Draw(newCoordinates: Point): void {
        this.canvasContext.beginPath();
        this.canvasContext.moveTo(this.lastPosition.x, this.lastPosition.y);
        this.canvasContext.lineTo(newCoordinates.x, newCoordinates.y);
        this.canvasContext.strokeStyle = 'black';
        this.canvasContext.lineWidth = 4;
        this.canvasContext.lineJoin = 'round';
        this.canvasContext.lineCap = 'round';
        this.canvasContext.stroke();
        this.canvasContext.closePath();

        this.SetLastCoordinates(newCoordinates);
    }

    private Dot(coordinates: Point): void {
        this.canvasContext.strokeRect(coordinates.x, coordinates.y, 2, 2);
    }

}
