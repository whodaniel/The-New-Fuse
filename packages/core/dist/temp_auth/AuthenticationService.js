var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AuthenticationService_1;
import { Injectable, Logger } from '@nestjs/common'; // Added Logger
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
// All from Incoming change
var AuthEventType;
(function (AuthEventType) {
    AuthEventType["LOGIN"] = "LOGIN";
    AuthEventType["LOGOUT"] = "LOGOUT";
    AuthEventType["PASSWORD_CHANGE"] = "PASSWORD_CHANGE";
    AuthEventType["TOKEN_REFRESH"] = "TOKEN_REFRESH";
})(AuthEventType || (AuthEventType = {}));
let AuthenticationService = AuthenticationService_1 = class AuthenticationService extends EventEmitter {
    constructor() {
        super(...arguments);
        this.logger = new Logger(AuthenticationService_1.name); // From Current
        this.sessions = new Map(); // From Incoming
        this.loginAttempts = []; // From Incoming
    }
    async login(username, password, deviceInfo) {
        this.logger.log(`Login attempt for ${username}`); // From Current
        // Stub implementation from Incoming
        const userId = uuidv4();
        const session = {
            id: uuidv4(),
            userId,
            token: uuidv4(),
            refreshToken: uuidv4(),
            expiresAt: new Date(Date.now() + 3600000), // 1 hour
            deviceInfo,
        };
        this.sessions.set(session.id, session);
        this.emit(AuthEventType.LOGIN, session);
        return session;
    }
    async logout(sessionId) {
        this.logger.log(`Logout for session ${sessionId}`); // From Current
        // Logic from Incoming
        const session = this.sessions.get(sessionId);
        if (session) {
            this.sessions.delete(sessionId);
            this.emit(AuthEventType.LOGOUT, session);
            return true;
        }
        return false;
    }
    // NOTE: 'refreshToken' from 'Current' is omitted as it
    // doesn't fit the new 'Incoming' structure.
    async validateSession(sessionId) {
        // From Incoming
        return this.sessions.get(sessionId) || null;
    }
};
AuthenticationService = AuthenticationService_1 = __decorate([
    Injectable()
], AuthenticationService);
export { AuthenticationService };
//# sourceMappingURL=AuthenticationService.js.map