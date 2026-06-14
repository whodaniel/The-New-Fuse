/**
 * Diagnostics Runner Step
 *
 * Run automated diagnostics to identify issues
 */
import React from 'react';
import { WizardContext } from '../WizardSystem.js';
export interface DiagnosticsRunnerProps {
    context: WizardContext;
    onDataChange: (data: Record<string, unknown>) => void;
    validationErrors?: string[];
}
export declare const DiagnosticsRunner: React.FC<DiagnosticsRunnerProps>;
//# sourceMappingURL=DiagnosticsRunner.d.ts.map