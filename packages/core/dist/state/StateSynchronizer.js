var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var StateSynchronizer_1;
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
let StateSynchronizer = StateSynchronizer_1 = class StateSynchronizer {
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        this.logger = new Logger(StateSynchronizer_1.name);
        this.state = {};
        this.version = 0;
    }
    async updateState(key, value) {
        try {
            this.state[key] = value;
            this.version++;
            this.eventEmitter.emit('state.updated', { key, value, version: this.version });
            this.logger.debug(`State updated: ${key}`);
        }
        catch (error) {
            this.logger.error('Failed to update state', error);
            throw error;
        }
    }
    getState(key) {
        if (key) {
            return this.state[key];
        }
        return { ...this.state };
    }
    async createSnapshot() {
        return {
            id: `snapshot-${Date.now()}`,
            data: { ...this.state },
            timestamp: new Date(),
            version: this.version
        };
    }
    async restoreSnapshot(snapshot) {
        try {
            this.state = { ...snapshot.data };
            this.version = snapshot.version;
            this.eventEmitter.emit('state.restored', snapshot);
            this.logger.log(`State restored from snapshot: ${snapshot.id}`);
        }
        catch (error) {
            this.logger.error('Failed to restore snapshot', error);
            throw error;
        }
    }
    async synchronize(remoteState) {
        try {
            Object.assign(this.state, remoteState);
            this.version++;
            this.eventEmitter.emit('state.synchronized', { version: this.version });
            this.logger.log('State synchronized');
        }
        catch (error) {
            this.logger.error('Failed to synchronize state', error);
            throw error;
        }
    }
};
StateSynchronizer = StateSynchronizer_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [EventEmitter2])
], StateSynchronizer);
export { StateSynchronizer };
//# sourceMappingURL=StateSynchronizer.js.map