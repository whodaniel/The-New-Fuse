import { AssimilationEngine } from './AssimilationEngine.js';
import { DirectiveConversionService } from './DirectiveConversionService.js';
import { LivingStateService } from './LivingStateService.js';
import { ProceduralDisclosureService } from './ProceduralDisclosureService.js';
import { SessionHandoffService } from './SessionHandoffService.js';
import { TurnZeroService, type TurnZeroResult } from './TurnZeroService.js';
export type ProtocolCheckResult = {
    name: string;
    passed: boolean;
    details: string;
};
export type ProtocolSummary = {
    timestamp: string;
    checks: ProtocolCheckResult[];
    allPassed: boolean;
    activeDirective: string | null;
    turnZero: TurnZeroResult | null;
};
export declare class ProtocolInterceptor {
    private repoRoot;
    turnZero: TurnZeroService;
    livingState: LivingStateService;
    handoff: SessionHandoffService;
    assimilation: AssimilationEngine;
    disclosure: ProceduralDisclosureService;
    directives: DirectiveConversionService;
    constructor(repoRoot: string);
    getStateSummary(): Record<string, unknown>;
    resolve(relativePath: string): string;
    /**
     * Run all protocol checks and return a summary.
     */
    runPreFlightChecks(): Promise<ProtocolSummary>;
    /**
     * Enforce Turn Zero - ensure state files exist.
     * Throws if critical files are missing.
     */
    enforceTurnZero(): void;
}
//# sourceMappingURL=ProtocolInterceptor.d.ts.map