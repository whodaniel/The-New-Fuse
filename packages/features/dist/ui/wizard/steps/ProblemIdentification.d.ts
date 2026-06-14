/**
 * Problem Identification Step
 *
 * Help users identify and describe their issue
 */
import React from 'react';
import { WizardContext } from '../WizardSystem.js';
export interface ProblemIdentificationProps {
    context: WizardContext;
    onDataChange: (data: Record<string, unknown>) => void;
    validationErrors?: string[];
}
export declare const ProblemIdentification: React.FC<ProblemIdentificationProps>;
//# sourceMappingURL=ProblemIdentification.d.ts.map