export declare class AssimilationService {
    private repoRoot;
    constructor(repoRoot: string);
    /**
     * Run a command through an external agent CLI, forcing it to
     * conform to TNF protocols natively.
     *
     * @param provider The external agent CLI (e.g. 'opencode', 'openclaw')
     * @param args The arguments to pass
     */
    runAssimilatedCommand(provider: string, args: string[]): Promise<void>;
    /**
     * Register a new external CLI mapping into the assimilation routing table.
     */
    linkProvider(provider: string): void;
}
//# sourceMappingURL=AssimilationService.d.ts.map