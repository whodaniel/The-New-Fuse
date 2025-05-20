/**
 * This file provides a simple way to test the Roo monitoring system.
 * It creates a test output channel that simulates Roo Coder output
 * and verifies that the monitoring system correctly captures and forwards it.
 */
export declare class RooMonitorTester {
    private outputChannel;
    private testWs;
    private monitor;
    constructor();
    startTest(): Promise<void>;
    private generateTestOutput;
    dispose(): void;
}
export declare function runRooMonitorTest(): any;
//# sourceMappingURL=test-roo-monitor.d.ts.map