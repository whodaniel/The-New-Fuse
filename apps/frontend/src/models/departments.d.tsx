import { PermissionLevel, UserRole } from './enums.js';
export interface Department {
    id: string;
    name: string;
    description: string;
    parentId?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface DepartmentMember {
    id: string;
    departmentId: string;
    userId: string;
    role: UserRole;
    permissions: PermissionLevel[];
    joinedAt: Date;
}
export interface DepartmentSettings {
    id: string;
    departmentId: string;
    allowGuests: boolean;
    maxMembers: number;
    features: string[];
    customization: Record<string, any>;
}
export interface DepartmentInvite {
    id: string;
    departmentId: string;
    email: string;
    role: UserRole;
    permissions: PermissionLevel[];
    expiresAt: Date;
    createdBy: string;
    status: 'pending' | 'accepted' | 'rejected' | 'expired';
}
export interface DepartmentHierarchy {
    department: Department;
    children: DepartmentHierarchy[];
    members: DepartmentMember[];
}
export interface DepartmentStats {
    totalMembers: number;
    activeMembers: number;
    tasksCompleted: number;
    averageTaskCompletion: number;
    resourceUtilization: number;
}
export declare class DepartmentUtils {
    static isParentDepartment(department: Department): boolean;
    static canManageDepartment(member: DepartmentMember, requiredPermissions: PermissionLevel[]): boolean;
    static getFullDepartmentPath(department: Department, allDepartments: Department[]): Department[];
    static getDepartmentDescendants(departmentId: string, hierarchy: DepartmentHierarchy): Department[];
}
