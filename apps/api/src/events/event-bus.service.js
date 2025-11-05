var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
let EventBus = class EventBus {
    subject = new Subject();
    emit(event) {
        const fullEvent = {
            ...event,
            timestamp: new Date(),
        };
        this.subject.next(fullEvent);
    }
    subscribe(callback) {
        return this.subject.subscribe(callback);
    }
    get observable() {
        return this.subject.asObservable();
    }
};
EventBus = __decorate([
    Injectable()
], EventBus);
export { EventBus };
//# sourceMappingURL=event-bus.service.js.map