/**
 * Workspace Setup - Workspace creation step
 */
import React from 'react';
import { WizardContext } from '../WizardSystem.js';
export interface WorkspaceSetupProps {
    context: WizardContext;
    onDataChange: (data: Record<string, unknown>) => void;
    validationErrors?: string[];
}
export declare const WorkspaceSetup: React.FC<WorkspaceSetupProps>;
//# sourceMappingURL=WorkspaceSetup.d.ts.map