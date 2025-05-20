import * as vscode from 'vscode';

export class A2ACoordinator {
    private workers: Map<string, (task: any) => Promise<void>> = new Map();

    constructor() {}

    startWorker(id: string, handler: (task: any) => Promise<void>) {
        this.workers.set(id, handler);
    }

    async dispatchTask(workerId: string, task: any): Promise<void> {
        const worker = this.workers.get(workerId);
        if (!worker) {
            throw new Error(`No worker found with id ${workerId}`);
        }
        await worker(task);
    }
}