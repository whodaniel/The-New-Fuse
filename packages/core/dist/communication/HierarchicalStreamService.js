var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HierarchicalStreamService_1;
import { Injectable, Logger } from '@nestjs/common';
import { Subject } from 'rxjs';
let HierarchicalStreamService = HierarchicalStreamService_1 = class HierarchicalStreamService {
    constructor() {
        this.logger = new Logger(HierarchicalStreamService_1.name);
        this.streams = new Map();
        this.streamMeta = new Map();
        this.subscriptions = new Map();
    }
    appendEvent(path, event) {
        const streamId = this.normalizePath(path);
        this.ensureStream(streamId);
        const fullEvent = {
            id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            path: streamId,
            timestamp: new Date().toISOString(),
            ...event,
        };
        const subject = this.streams.get(streamId);
        subject.next(fullEvent);
        const meta = this.streamMeta.get(streamId);
        if (meta) {
            meta.eventCount++;
        }
        this.logger.debug(`Appended event to ${streamId}: ${fullEvent.type}`);
        return fullEvent;
    }
    subscribeToPath(path, handler) {
        const streamId = this.normalizePath(path);
        this.ensureStream(streamId);
        const subject = this.streams.get(streamId);
        const sub = subject.asObservable().subscribe(handler);
        const subs = this.subscriptions.get(streamId) || [];
        subs.push(sub);
        this.subscriptions.set(streamId, subs);
        return sub;
    }
    sendToSubAgent(parentAgent, subAgentName, payload) {
        const inputPath = `./${subAgentName}`;
        return this.appendEvent(inputPath, {
            parentAgent,
            subAgent: subAgentName,
            type: 'request',
            payload,
        });
    }
    subscribeToSubAgentResults(subAgentName, handler) {
        const outputPath = `./${subAgentName}/results`;
        return this.subscribeToPath(outputPath, handler);
    }
    respondFromSubAgent(subAgentName, parentAgent, payload) {
        const outputPath = `./${subAgentName}/results`;
        return this.appendEvent(outputPath, {
            parentAgent,
            subAgent: subAgentName,
            type: 'response',
            payload,
        });
    }
    reportProgress(subAgentName, parentAgent, progress) {
        const inputPath = `./${subAgentName}`;
        return this.appendEvent(inputPath, {
            parentAgent,
            subAgent: subAgentName,
            type: 'progress',
            payload: progress,
        });
    }
    getStreamInfo(path) {
        return this.streamMeta.get(this.normalizePath(path));
    }
    getActiveStreams() {
        return Array.from(this.streamMeta.values());
    }
    closeStream(path) {
        const streamId = this.normalizePath(path);
        const subject = this.streams.get(streamId);
        if (subject) {
            subject.complete();
            this.streams.delete(streamId);
        }
        const subs = this.subscriptions.get(streamId);
        if (subs) {
            subs.forEach((s) => s.unsubscribe());
            this.subscriptions.delete(streamId);
        }
        this.streamMeta.delete(streamId);
        this.logger.log(`Stream closed: ${streamId}`);
    }
    async shutdown() {
        for (const [streamId, subject] of this.streams) {
            subject.complete();
        }
        this.streams.clear();
        for (const [streamId, subs] of this.subscriptions) {
            subs.forEach((s) => s.unsubscribe());
        }
        this.subscriptions.clear();
        this.streamMeta.clear();
        this.logger.log('HierarchicalStreamService shutdown complete');
    }
    ensureStream(streamId) {
        if (!this.streams.has(streamId)) {
            this.streams.set(streamId, new Subject());
            const parts = streamId.replace(/^\.\//, '').split('/');
            const subAgentName = parts[0];
            const isOutput = parts.length > 1 && parts[1] === 'results';
            this.streamMeta.set(streamId, {
                subAgentName,
                inputPath: `./${subAgentName}`,
                outputPath: `./${subAgentName}/results`,
                eventCount: 0,
                createdAt: new Date().toISOString(),
            });
        }
    }
    normalizePath(path) {
        return path.startsWith('/') ? `.${path}` : path.startsWith('./') ? path : `./${path}`;
    }
};
HierarchicalStreamService = HierarchicalStreamService_1 = __decorate([
    Injectable()
], HierarchicalStreamService);
export { HierarchicalStreamService };
//# sourceMappingURL=HierarchicalStreamService.js.map