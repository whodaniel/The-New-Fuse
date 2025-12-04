import { useAuth } from '@/providers/AuthProvider';
export var useAuthorization = function () {
    var user = useAuth().user;
    var hasRole = function (roles) {
        if (!user)
            return false;
        return roles.includes(user.role);
    };
    var canAccess = function (resource, action) {
        if (!user)
            return false;
        // Add your permission logic here
        var permissions = {
            ADMIN: ['*'],
            USER: ['read:own', 'write:own'],
            GUEST: ['read:public'],
        };
        var userPermissions = permissions[user.role] || [];
        var requiredPermission = "".concat(action, ":").concat(resource);
        return userPermissions.includes('*') || userPermissions.includes(requiredPermission);
    };
    return {
        hasRole: hasRole,
        canAccess: canAccess,
        isAdmin: (user === null || user === void 0 ? void 0 : user.role) === 'ADMIN',
        isUser: (user === null || user === void 0 ? void 0 : user.role) === 'USER',
    };
};
