var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
let ComponentAnalysisSubscriber = class ComponentAnalysisSubscriber {
    constructor() {
        this.subscribers = new Map();
    }
    subscribe(componentId, callback) {
        if (!this.subscribers.has(componentId)) {
            this.subscribers.set(componentId, []);
        }
        this.subscribers.get(componentId).push(callback);
    }
    unsubscribe(componentId, callback) {
        const callbacks = this.subscribers.get(componentId);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }
    notify(event) {
        const callbacks = this.subscribers.get(event.componentId);
        if (callbacks) {
            callbacks.forEach(callback => callback(event));
        }
    }
};
ComponentAnalysisSubscriber = __decorate([
    Injectable()
], ComponentAnalysisSubscriber);
export { ComponentAnalysisSubscriber };
//# sourceMappingURL=ComponentAnalysisSubscriber.js.map