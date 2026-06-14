/**
 * CloudRuntime Connection Step
 *
 * Step for connecting to CloudRuntime and verifying authentication
 */
import React from 'react';
import { WizardContext } from '../WizardSystem.js';
export interface CloudRuntimeConnectionProps {
    context: WizardContext;
    onDataChange: (data: Record<string, unknown>) => void;
    validationErrors?: string[];
}
export declare const CloudRuntimeConnection: React.FC<CloudRuntimeConnectionProps>;
//# sourceMappingURL=CloudRuntimeConnection.d.ts.map