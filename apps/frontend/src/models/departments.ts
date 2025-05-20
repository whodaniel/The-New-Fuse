import { UserRole } from './enums.js';
export class DepartmentUtils {
    static isParentDepartment(department: any) {
        return !department.parentId;
    }
    static canManageDepartment(member: any, requiredPermissions: string[]) {
        if (member.role === UserRole.ADMIN)
            return true;
        return requiredPermissions.every(permission => member.permissions.includes(permission));
    }
    static getFullDepartmentPath(department: any, allDepartments: any[]) {
        const path = [department];
        let currentId = department.parentId;
        while (currentId) {
            const parent = allDepartments.find(d => d.id === currentId);
            if (!parent)
                break;
            path.unshift(parent);
            currentId = parent.parentId;
        }
        return path;
    }
    static getDepartmentDescendants(departmentId: string, hierarchy: any) {
        const descendants = [];
        function traverse(node: any): any {
            if (node.department.parentId === departmentId) {
                descendants.push(node.department);
            }
            node.children.forEach(traverse);
        }
        traverse(hierarchy);
        return descendants;
    }
}
//# sourceMappingURL=departments.js.map