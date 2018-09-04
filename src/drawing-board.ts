import { Point } from "./point";

export class DrawingBoard {
    private isMouseDown: boolean = false;
    private canvas: HTMLCanvasElement;
    private canvasContext: any;
    private lastPosition: Point = new Point(0, 0);

    public constructor(elementId: string) {
        this.canvas = document.getElementById(elementId) as HTMLCanvasElement;
        this.canvasContext = this.canvas.getContext("2d");
        this.setEvents(this.canvas);
    }

    public ClearCanvas() {
        this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    public toDataUrl() {
        return this.canvas.toDataURL();
    }

    private setEvents(canvas: HTMLCanvasElement): void {
        canvas.addEventListener('mousedown', (e: MouseEvent) => {
            this.isMouseDown = true;
            const coordinates = this.GetCurrentCoordinates(e, canvas);
            this.SetLastCoordinates(coordinates);
        });

        canvas.addEventListener('touchstart', (e) => {
            this.isMouseDown = true;
            const coordinates = this.GetTouchCoordinates(e, canvas);
            this.SetLastCoordinates(coordinates);
        });

        canvas.addEventListener('mousemove', (e) => {
            if (this.isMouseDown) {
                const coordinates = this.GetCurrentCoordinates(e, canvas);
                this.Draw(coordinates);
            }
        });
        canvas.addEventListener('touchmove', (e) => {
            if (this.isMouseDown) {
                const coordinates = this.GetTouchCoordinates(e, canvas);
                this.Draw(coordinates);
            }
        });

        canvas.addEventListener('mouseup', (e) => {
            this.isMouseDown = false;
        });
        canvas.addEventListener('mouseleave', (e) => {
            this.isMouseDown = false;
        });
        canvas.addEventListener('touchend', (e) => {
            this.isMouseDown = false;
        });
    }

    private GetCurrentCoordinates(mouseEvent: MouseEvent, canvasElement: HTMLCanvasElement): Point {
        const x = mouseEvent.clientX - canvasElement.offsetLeft;
        const y = mouseEvent.clientY - canvasElement.offsetTop;
        return new Point(x, y);
    }

    private GetTouchCoordinates(touchEvent: TouchEvent, canvasElement: HTMLCanvasElement): Point {
        const x = touchEvent.touches[0].clientX - canvasElement.offsetLeft;
        const y = touchEvent.touches[0].clientY - canvasElement.offsetTop;
        return new Point(x, y);
    }

    private SetLastCoordinates(coordinates: Point) {
        this.lastPosition.x = coordinates.x;
        this.lastPosition.y = coordinates.y;
    }

    private Draw(newCoordinates: Point) {
        this.canvasContext.beginPath();
        this.canvasContext.moveTo(this.lastPosition.x, this.lastPosition.y);
        this.canvasContext.lineTo(newCoordinates.x, newCoordinates.y);
        this.canvasContext.strokeStyle = 'black';
        this.canvasContext.lineWidth = 2;
        this.canvasContext.lineJoin = 'round';
        this.canvasContext.lineCap = 'round';
        this.canvasContext.stroke();
        this.canvasContext.closePath();

        this.SetLastCoordinates(newCoordinates);
    }

    
}