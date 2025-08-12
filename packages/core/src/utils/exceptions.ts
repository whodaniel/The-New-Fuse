export class StateTransferError {
    constructor(): unknown {
        super(message);
        this.name = 'StateTransferError';
    }
}

export class TaskExecutionError {
    constructor(): unknown {
        super(message);
        this.name = 'TaskExecutionError';
    }
}

export class ValidationError {
    constructor(): unknown {
        super(message);
        this.name = 'ValidationError';
    }
}