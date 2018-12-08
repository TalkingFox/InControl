import { Observable, Subject, Subscribable, Subscription } from 'rxjs';

export class TalkativeArray<T> {
    public elements: T[] = [];

    private subject: Subject<T>;

    constructor() {
        this.subject = new Subject<T>();
    }

    public clone(): T[] {
        return this.elements.splice(0);
    }

    public get length(): number {
        return this.elements.length;
    }

    public clear(): void {
        this.elements.length = 0;
    }

    public Push(element: T) {
        this.elements.push(element);
        this.subject.next(element);
    }

    public Subscribe(next?: (value: T) => void): Subscription {
        return this.subject.asObservable().subscribe(next);
    }
}
