/**
 * Solution Steps
 *
 * Guide users through fixing identified issues
 */
import React from 'react';
import { WizardContext } from '../WizardSystem.js';
export interface SolutionStepsProps {
    context: WizardContext;
    onDataChange: (data: Record<string, unknown>) => void;
    validationErrors?: string[];
}
export declare const SolutionSteps: React.FC<SolutionStepsProps>;
//# sourceMappingURL=SolutionSteps.d.ts.map