export class StateTransferError {
    constructor(): void {
        super(message);
        this.name = 'StateTransferError';
    }
}

export class TaskExecutionError {
    constructor(): void {
        super(message);
        this.name = 'TaskExecutionError';
    }
}

export class ValidationError {
    constructor(): void {
        super(message);
        this.name = 'ValidationError';
    }
}