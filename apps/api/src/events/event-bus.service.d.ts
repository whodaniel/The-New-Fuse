export interface Event {
    type: string;
    payload: any;
    timestamp: Date;
}
export declare class EventBus {
    private subject;
    emit(event: Omit<Event, 'timestamp'>): void;
    subscribe(callback: (event: Event) => void): import("rxjs").Subscription;
    get observable(): import("rxjs").Observable<Event>;
}
//# sourceMappingURL=event-bus.service.d.ts.map