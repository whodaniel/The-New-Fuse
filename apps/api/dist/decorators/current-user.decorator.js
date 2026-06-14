"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentUser = void 0;
const common_1 = require("@nestjs/common");
function firstNonEmptyString(...values) {
    for (const value of values) {
        if (typeof value !== 'string')
            continue;
        const normalized = value.trim();
        if (normalized.length > 0)
            return normalized;
    }
    return undefined;
}
function resolveCanonicalUserId(user) {
    return firstNonEmptyString(user.id, user.sub, user.user_id, user.userId);
}
exports.CurrentUser = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const rawUser = request?.user;
    if (!rawUser || typeof rawUser !== 'object') {
        return rawUser;
    }
    const canonicalUserId = resolveCanonicalUserId(rawUser);
    const normalizedUser = !rawUser.id && canonicalUserId ? { ...rawUser, id: canonicalUserId } : rawUser;
    if (typeof data === 'string' && data.length > 0) {
        if (data === 'id') {
            return canonicalUserId;
        }
        if (Object.prototype.hasOwnProperty.call(normalizedUser, data)) {
            return normalizedUser[data];
        }
        return undefined;
    }
    return normalizedUser;
});
//# sourceMappingURL=current-user.decorator.js.map