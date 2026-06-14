/**
 * Agent Capabilities Step
 *
 * Step for selecting and configuring agent capabilities
 */
import React from 'react';
import { WizardContext } from '../WizardSystem.js';
export interface AgentCapabilitiesProps {
    context: WizardContext;
    onDataChange: (data: Record<string, unknown>) => void;
    validationErrors?: string[];
}
export declare const AgentCapabilities: React.FC<AgentCapabilitiesProps>;
//# sourceMappingURL=AgentCapabilities.d.ts.map