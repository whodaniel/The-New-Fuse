export class AuthService {
    static async getUserData(uid) {
        var _a, _b, _c, _d;
        return {
            id: uid,
            email: ((_a = auth.currentUser) === null || _a === void 0 ? void 0 : _a.email) || '',
            displayName: ((_b = auth.currentUser) === null || _b === void 0 ? void 0 : _b.displayName) || '',
            photoURL: ((_c = auth.currentUser) === null || _c === void 0 ? void 0 : _c.photoURL) || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isVerified: ((_d = auth.currentUser) === null || _d === void 0 ? void 0 : _d.emailVerified) || false,
            is2FAEnabled: false,
        };
    }
    static async enable2FA(userId) {
        return 'EXAMPLE2FASECRET';
    }
    static async disable2FA(userId) {
    }
}
//# sourceMappingURL=auth.js.map