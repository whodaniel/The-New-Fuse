/**
 * Role Configuration Step
 *
 * Configure user roles and permissions for RBAC
 */
import React from 'react';
import { WizardContext } from '../WizardSystem.js';
export interface RoleConfigurationProps {
    context: WizardContext;
    onDataChange: (data: Record<string, unknown>) => void;
    validationErrors?: string[];
}
export declare const RoleConfiguration: React.FC<RoleConfigurationProps>;
//# sourceMappingURL=RoleConfiguration.d.ts.map