export class StateTransferError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'StateTransferError';
    }
}

export class TaskExecutionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TaskExecutionError';
    }
}

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}