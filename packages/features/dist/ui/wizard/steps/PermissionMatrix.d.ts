/**
 * Permission Matrix Step
 *
 * Configure detailed permissions for each role
 */
import React from 'react';
import { WizardContext } from '../WizardSystem.js';
export interface PermissionMatrixProps {
    context: WizardContext;
    onDataChange: (data: Record<string, unknown>) => void;
    validationErrors?: string[];
}
export declare const PermissionMatrix: React.FC<PermissionMatrixProps>;
//# sourceMappingURL=PermissionMatrix.d.ts.map