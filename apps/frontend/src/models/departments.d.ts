export declare class DepartmentUtils {
    static isParentDepartment(department: any): boolean;
    static canManageDepartment(member: any, requiredPermissions: string[]): boolean;
    static getFullDepartmentPath(department: any, allDepartments: any[]): any[];
    static getDepartmentDescendants(departmentId: string, hierarchy: any): any[];
}
