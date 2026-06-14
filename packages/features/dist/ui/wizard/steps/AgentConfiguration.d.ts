/**
 * Agent Configuration Step
 *
 * Step for configuring a new agent's basic settings
 */
import React from 'react';
import { WizardContext } from '../WizardSystem.js';
export interface AgentConfigurationProps {
    context: WizardContext;
    onDataChange: (data: Record<string, unknown>) => void;
    validationErrors?: string[];
}
export declare const AgentConfiguration: React.FC<AgentConfigurationProps>;
//# sourceMappingURL=AgentConfiguration.d.ts.map