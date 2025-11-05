import { UserRole, UserPreferences, UserMetadata } from './user.types';
/**
 * Represents an authenticated user in requests.
 * Consolidates user properties from various user interfaces in the codebase.
 */
export interface AuthenticatedUser {
    /** Unique identifier for the user */
    id: string;
    /** User's email address */
    email: string;
    /** User's unique username */
    username: string;
    /** User's display name (optional) */
    displayName?: string;
    /** User's avatar URL (optional) */
    avatarUrl?: string;
    /** Array of roles assigned to the user */
    roles: UserRole[];
    /** Whether the user account is active */
    isActive: boolean;
    /** Last login timestamp */
    lastLogin?: Date | null;
    /** User preferences and settings */
    preferences?: UserPreferences;
    /** Additional user metadata */
    metadata?: UserMetadata;
    /** Authentication provider (e.g., 'google', 'github', 'local') */
    authProvider?: string;
    /** External auth provider ID */
    authProviderId?: string;
    /** JWT subject claim (for backward compatibility) */
    sub?: string;
    /** Creation timestamp */
    createdAt?: Date;
    /** Last update timestamp */
    updatedAt?: Date;
}
/**
 * Extended Request interface that includes authenticated user information.
 * Use this interface for all NestJS controller methods that require authentication.
 */
export interface AuthenticatedRequest extends Request {
    /** The authenticated user object */
    user?: AuthenticatedUser;
}
//# sourceMappingURL=request.types.d.ts.map