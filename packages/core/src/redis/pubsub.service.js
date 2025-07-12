var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
let PubSubService = class PubSubService {
    subscriptions = new Map();
    async subscribe(channel, callback) {
        if (!this.subscriptions.has(channel)) {
            this.subscriptions.set(channel, new Set());
        }
        this.subscriptions.get(channel).add(callback);
    }
    async unsubscribe(channel, callback) {
        const callbacks = this.subscriptions.get(channel);
        if (callbacks) {
            callbacks.delete(callback);
            if (callbacks.size === 0) {
                this.subscriptions.delete(channel);
            }
        }
    }
    async publish(channel, message) {
        const callbacks = this.subscriptions.get(channel);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(message, channel);
                }
                catch (error) {
                    console.error(`Error in pubsub callback for channel ${channel}:`, error);
                }
            });
        }
    }
    async unsubscribeAll(channel) {
        this.subscriptions.delete(channel);
    }
};
PubSubService = __decorate([
    Injectable()
], PubSubService);
export { PubSubService };
