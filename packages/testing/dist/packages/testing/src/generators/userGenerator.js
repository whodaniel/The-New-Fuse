"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUsers = exports.generateUser = exports.generateUserPreferences = void 0;
const utils_1 = require("./utils");
const FIRST_NAMES = ['Alice', 'Bob', 'Charlie', 'David', 'Emma', 'Frank', 'Grace', 'Henry'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
const ROLES = ['admin', 'user', 'viewer', 'manager'];
const STATUSES = ['active', 'inactive', 'pending', 'suspended'];
const LANGUAGES = ['en', 'es', 'fr', 'de', 'it'];
const generateUserPreferences = () => ({
    theme: (0, utils_1.generateEnum)(['light', 'dark', 'system']),
    notifications: (0, utils_1.generateBoolean)(),
    language: (0, utils_1.generateEnum)(LANGUAGES)
});
exports.generateUserPreferences = generateUserPreferences;
const generateUser = (options = {}) => {
    const firstName = (0, utils_1.generateEnum)(FIRST_NAMES);
    const lastName = (0, utils_1.generateEnum)(LAST_NAMES);
    const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
    const timestamps = {
        createdAt: (0, utils_1.generateTimestamp)({ past: true, daysRange: 365 }),
        updatedAt: (0, utils_1.generateTimestamp)({ past: true, daysRange: 30 }),
        ...((0, utils_1.generateBoolean)(0.8) && {
            lastLoginAt: (0, utils_1.generateTimestamp)({ past: true, daysRange: 7 })
        })
    };
    return {
        id: (0, utils_1.generateId)('user_'),
        username,
        email: (0, utils_1.generateEmail)(username),
        role: options.role || (0, utils_1.generateEnum)(ROLES),
        status: options.status || (0, utils_1.generateEnum)(STATUSES),
        firstName,
        lastName,
        ...timestamps,
        ...(options.withPreferences && { preferences: (0, exports.generateUserPreferences)() }),
        ...(options.withMetadata && {
            metadata: {
                loginCount: Math.floor(Math.random() * 100),
                verified: (0, utils_1.generateBoolean)(),
                lastIp: '192.168.1.' + Math.floor(Math.random() * 255)
            }
        })
    };
};
exports.generateUser = generateUser;
const generateUsers = (count, options = {}) => {
    return Array.from({ length: count }, () => (0, exports.generateUser)(options));
};
exports.generateUsers = generateUsers;
//# sourceMappingURL=userGenerator.js.map