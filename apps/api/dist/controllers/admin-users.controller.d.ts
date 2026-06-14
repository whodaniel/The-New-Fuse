import { DatabaseService } from '@the-new-fuse/database/drizzle';
import { AuditService } from '../services/audit.service';
/**
 * Admin Users Controller
 *
 * Handles administrative operations for user management including:
 * - Viewing all users across the platform
 * - Updating user roles and permissions
 * - Activating/deactivating user accounts
 * - Viewing user activity and statistics
 *
 * All endpoints require SUPER_ADMIN or admin role access.
 */
export declare class AdminUsersController {
    private readonly auditService;
    private readonly db;
    private readonly userRepository;
    constructor(auditService: AuditService, db: DatabaseService);
    /**
     * Get all users with pagination and filtering
     */
    getAllUsers(limit?: string, offset?: string, role?: string, active?: string): Promise<{
        data: any;
        total: number;
        limit: number;
        offset: number;
    }>;
    /**
     * Get user by ID (admin view with full details)
     */
    getUserById(id: string): Promise<any>;
    /**
     * Update user role (admin only)
     */
    updateUserRole(id: string, roleData: {
        role: string;
        roles?: string[];
    }): Promise<any>;
    /**
     * Set membership override (server-side only).
     * This bypasses payment processors and marks a user as PRO/ENTERPRISE.
     */
    setMembershipOverride(id: string, payload: {
        tier?: 'STARTER' | 'PRO' | 'ENTERPRISE' | string;
        reason?: string;
        expiresAt?: string;
        attachRole?: boolean;
    }, req: any): Promise<{
        status: "ACTIVE" | "EXPIRED" | "REVOKED";
        id: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        expiresAt: Date | null;
        tier: "ENTERPRISE" | "STARTER" | "PRO";
        reason: string | null;
        createdByUserId: string | null;
        revokedByUserId: string | null;
        revokedAt: Date | null;
    }>;
    /**
     * Revoke membership override for a user.
     */
    revokeMembershipOverride(id: string, req: any): Promise<{
        success: boolean;
    }>;
    /**
     * List membership overrides for a user.
     */
    listMembershipOverrides(id: string): Promise<Record<string, unknown>[]>;
    /**
     * Activate user account
     */
    activateUser(id: string): Promise<any>;
    /**
     * Deactivate user account
     */
    deactivateUser(id: string): Promise<any>;
    /**
     * Delete user (soft delete)
     */
    deleteUser(id: string): Promise<{
        message: string;
        deleted: boolean;
    }>;
    /**
     * Get user statistics
     */
    getUserStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
        roleDistribution: Record<string, number>;
    }>;
    /**
     * Search users
     */
    searchUsers(query: string): Promise<any[]>;
    /**
     * Sanitize user object by removing sensitive fields
     */
    private sanitizeUser;
}
//# sourceMappingURL=admin-users.controller.d.ts.map