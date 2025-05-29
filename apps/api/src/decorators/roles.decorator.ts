import { SetMetadata } from '@nestjs/common';
import { EnhancedUserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: EnhancedUserRole[]) => SetMetadata(ROLES_KEY, roles);
