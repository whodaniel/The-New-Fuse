import { createMatcher } from './utils.js';

interface UserWithPermissions {
  id: string;
  permissions?: string[];
  roles?: { name: string; permissions: string[] }[];
}

export const toHavePermission = createMatcher(
  (received: UserWithPermissions, permission: string) => {
    // Check direct permissions
    if (received.permissions?.includes(permission)) {
      return true;
    }

    // Check role-based permissions
    return received.roles?.some(role => role.permissions.includes(permission)) ?? false;
  },
  (received, permission) => 
    `Expected user ${received.id} to have permission "${permission}", but they don't`,
  (received, permission) => 
    `Expected user ${received.id} not to have permission "${permission}", but they do`
);