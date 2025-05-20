import { LoggingService } from '../../services/logging.js';
export class StateManager {
    constructor() {
        this.state = {};
        this.stateHistory = [];
        this.maxHistorySize = 100;
        this.eventBus = EventBus.getInstance();
        this.logger = LoggingService.getInstance();
        this.subscribers = new Map();
    }
    static getInstance() {
        if (!StateManager.instance) {
            StateManager.instance = new StateManager();
        }
        return StateManager.instance;
    }
    setState(path, value) {
        const oldValue = this.getState(path);
        if (this.isEqual(oldValue, value))
            return;
        let current = this.state;
        for (let i = 0; i < path.length - 1; i++) {
            if (!(path[i] in current)) {
                current[path[i]] = {};
            }
            current = current[path[i]];
        }
        const lastKey = path[path.length - 1];
        current[lastKey] = value;
        const changeEvent = {
            path,
            oldValue,
            newValue: value,
            timestamp: Date.now()
        };
        this.addToHistory(changeEvent);
        this.notifySubscribers(path, value);
        this.eventBus.emit('state_change', changeEvent, 'StateManager');
    }
    getState(path) {
        let current = this.state;
        for (const key of path) {
            if (current === undefined || current === null)
                return undefined;
            current = current[key];
        }
        return current;
    }
    subscribe(path, callback) {
        const pathString = path.join('.');
        if (!this.subscribers.has(pathString)) {
            this.subscribers.set(pathString, new Set());
        }
        this.subscribers.get(pathString).add(callback);
        const currentValue = this.getState(path);
        if (currentValue !== undefined) {
            callback(currentValue);
        }
        return () => {
            const subscribers = this.subscribers.get(pathString);
            if (subscribers) {
                subscribers.delete(callback);
                if (subscribers.size === 0) {
                    this.subscribers.delete(pathString);
                }
            }
        };
    }
    notifySubscribers(path, value) {
        const pathString = path.join('.');
        const subscribers = this.subscribers.get(pathString);
        if (subscribers) {
            subscribers.forEach(callback => {
                try {
                    callback(value);
                }
                catch (error) {
                    this.logger.error('Error in state subscriber callback:', error);
                }
            });
        }
        for (let i = path.length - 1; i > 0; i--) {
            const parentPath = path.slice(0, i).join('.');
            const parentSubscribers = this.subscribers.get(parentPath);
            if (parentSubscribers) {
                const parentValue = this.getState(path.slice(0, i));
                parentSubscribers.forEach(callback => {
                    try {
                        callback(parentValue);
                    }
                    catch (error) {
                        this.logger.error('Error in parent state subscriber callback:', error);
                    }
                });
            }
        }
    }
    addToHistory(event) {
        this.stateHistory.push(event);
        if (this.stateHistory.length > this.maxHistorySize) {
            this.stateHistory.shift();
        }
    }
    getHistory() {
        return [...this.stateHistory];
    }
    getHistoryForPath(path) {
        const pathString = path.join('.');
        return this.stateHistory.filter(event => event.path.join('.') === pathString);
    }
    clearHistory() {
        this.stateHistory = [];
        this.logger.info('State history cleared');
    }
    reset() {
        this.state = {};
        this.stateHistory = [];
        this.subscribers.clear();
        this.eventBus.emit('state_reset', null, 'StateManager');
        this.logger.info('State manager reset');
    }
    isEqual(a, b) {
        if (a === b)
            return true;
        if (a === null || b === null)
            return false;
        if (typeof a !== typeof b)
            return false;
        if (typeof a !== 'object')
            return false;
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        if (keysA.length !== keysB.length)
            return false;
        return keysA.every(key => this.isEqual(a[key], b[key]));
    }
    getSnapshot() {
        return JSON.parse(JSON.stringify(this.state));
    }
}
//# sourceMappingURL=stateManager.js.map