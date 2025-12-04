import { UserRole } from './enums';
var DepartmentUtils = /** @class */ (function () {
    function DepartmentUtils() {
    }
    DepartmentUtils.isParentDepartment = function (department) {
        return !department.parentId;
    };
    DepartmentUtils.canManageDepartment = function (member, requiredPermissions) {
        if (member.role === UserRole.ADMIN)
            return true;
        return requiredPermissions.every(function (permission) { return member.permissions.includes(permission); });
    };
    DepartmentUtils.getFullDepartmentPath = function (department, allDepartments) {
        var path = [department];
        var currentId = department.parentId;
        while (currentId) {
            var parent_1 = allDepartments.find(function (d) { return d.id === currentId; });
            if (!parent_1)
                break;
            path.unshift(parent_1);
            currentId = parent_1.parentId;
        }
        return path;
    };
    DepartmentUtils.getDepartmentDescendants = function (departmentId, hierarchy) {
        var descendants = [];
        function traverse(node) {
            if (node.department.parentId === departmentId) {
                descendants.push(node.department);
            }
            node.children.forEach(traverse);
        }
        traverse(hierarchy);
        return descendants;
    };
    return DepartmentUtils;
}());
export { DepartmentUtils };
