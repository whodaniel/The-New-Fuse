export class BaseWorkflowAgent {
    name: string;
    capabilities: string[];

    constructor(name: string, capabilities: string[]) {
        this.name = name;
        this.capabilities = [...capabilities];
    }

    async start(): Promise<void> {
    }

    async stop(): Promise<void> {
    }
}

export class WorkflowAgentError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'WorkflowAgentError';
    }
};
