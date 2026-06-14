export declare class ProtocolInterceptor {
    private repoRoot;
    constructor(repoRoot: string);
    /**
     * Enforces the Turn Zero Mandate.
     * Throws an error or logs a warning if required state files are missing.
     */
    enforceTurnZeroMandate(): void;
    /**
     * Runs all protocol checks.
     */
    runPreFlightChecks(): void;
}
//# sourceMappingURL=ProtocolInterceptor.d.ts.map