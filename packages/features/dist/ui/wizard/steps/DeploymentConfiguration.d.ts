/**
 * Deployment Configuration Step
 *
 * Configure deployment settings for CloudRuntime
 */
import React from 'react';
import { WizardContext } from '../WizardSystem.js';
export interface DeploymentConfigurationProps {
    context: WizardContext;
    onDataChange: (data: Record<string, unknown>) => void;
    validationErrors?: string[];
}
export declare const DeploymentConfiguration: React.FC<DeploymentConfigurationProps>;
//# sourceMappingURL=DeploymentConfiguration.d.ts.map