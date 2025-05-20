import { MCPContext } from './types.js';
import { EventEmitter } from 'events';

export class A2AContextManager extends EventEmitter {
    private context: Record<string, any>;
    private readonly persistenceKey = 'a2a_context';

    constructor() {
        super();
        this.context = {};
    }

    async initialize(): Promise<void> {
        try {
            const stored = localStorage.getItem(this.persistenceKey);
            if (stored) {
                this.context = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to initialize A2A context:', error);
        }
    }

    getCurrentContext(): MCPContext['current'] {
        return { ...this.context };
    }

    async updateContext(updates: Partial<MCPContext['current']>): Promise<void> {
        this.context = {
            ...this.context,
            ...updates,
            lastUpdated: Date.now()
        };
        
        await this.persistContext();
        this.emit('contextUpdated', this.context);
    }

    private async persistContext(): Promise<void> {
        try {
            localStorage.setItem(this.persistenceKey, JSON.stringify(this.context));
        } catch (error) {
            console.error('Failed to persist A2A context:', error);
        }
    }

    onContextUpdate(callback: (context: Record<string, any>) => void): void {
        this.on('contextUpdated', callback);
    }
}