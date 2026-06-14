/**
 * Agent Testing Step
 *
 * Interactive step to test the newly configured agent
 */
import React from 'react';
import { WizardContext } from '../WizardSystem.js';
export interface AgentTestingProps {
    context: WizardContext;
    onDataChange: (data: Record<string, unknown>) => void;
    validationErrors?: string[];
}
export declare const AgentTesting: React.FC<AgentTestingProps>;
//# sourceMappingURL=AgentTesting.d.ts.map