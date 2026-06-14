/**
 * Deployment Progress Step
 *
 * Show real-time deployment progress
 */
import React from 'react';
import { WizardContext } from '../WizardSystem.js';
export interface DeploymentProgressProps {
    context: WizardContext;
    onDataChange: (data: Record<string, unknown>) => void;
    validationErrors?: string[];
}
export declare const DeploymentProgress: React.FC<DeploymentProgressProps>;
//# sourceMappingURL=DeploymentProgress.d.ts.map