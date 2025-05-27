export declare class A2ACoordinator {
    private workers;
    constructor();
    startWorker(id: string, handler: (task: any) => Promise<void>): void;
    dispatchTask(workerId: string, task: any): Promise<void>;
}
//# sourceMappingURL=A2ACoordinator.d.ts.map