var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.AuthManagerImpl = void 0; // Cleaned up exports
import bcryptjs_1 from 'bcryptjs';
import jsonwebtoken_1 from 'jsonwebtoken';
var AuthenticationError = require('../../../types/error.js').AuthenticationError; // Use AuthenticationError
// AuthError and UserExistsError are removed
var AuthManagerImpl = /** @class */ (function () {
    function AuthManagerImpl(db, secretKey, tokenExpireMinutes) {
        if (tokenExpireMinutes === void 0) { tokenExpireMinutes = 60; }
        this.db = db;
        this.secretKey = secretKey;
        this.tokenExpireMinutes = tokenExpireMinutes;
    }
    AuthManagerImpl.prototype.registerUser = function (username, email, password) {
        return __awaiter(this, void 0, void 0, function () {
            var existingUser, hashedPassword, user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query(User).filter(true).first()];
                    case 1:
                        existingUser = _a.sent();
                        if (existingUser) {
                            throw new AuthenticationError('User already exists', 409, undefined, undefined, 'USER_EXISTS');
                        }
                        return [4 /*yield*/, bcryptjs_1.default.hash(password, 10)];
                    case 2:
                        hashedPassword = _a.sent();
                        user = { id: Date.now(), username: username, email: email, hashedPassword: hashedPassword };
                        return [4 /*yield*/, this.db.add(user)];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, this.db.commit()];
                    case 4:
                        _a.sent();
                        return [2 /*return*/, user];
                }
            });
        });
    };
    AuthManagerImpl.prototype.loginUser = function (username, password) {
        return __awaiter(this, void 0, void 0, function () {
            var user, _a, payload;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.db.query(User).filter(true).first()];
                    case 1:
                        user = _b.sent();
                        _a = !user;
                        if (_a) return [3 /*break*/, 3];
                        return [4 /*yield*/, bcryptjs_1.default.compare(password, user.hashedPassword)];
                    case 2:
                        _a = !(_b.sent());
                        _b.label = 3;
                    case 3:
                        if (_a) {
                            throw new AuthenticationError('Invalid credentials', 401);
                        }
                        payload = { sub: user.id, exp: Math.floor(Date.now() / 1000) + this.tokenExpireMinutes * 60, iat: Math.floor(Date.now() / 1000) };
                        return [2 /*return*/, jsonwebtoken_1.default.sign(payload, this.secretKey)];
                }
            });
        });
    };
    AuthManagerImpl.prototype.verifyToken = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                try {
                    return [2 /*return*/, jsonwebtoken_1.default.verify(token, this.secretKey)];
                }
                catch (error) {
                    throw new AuthenticationError('Invalid token', 401);
                }
                return [2 /*return*/];
            });
        });
    };
    return AuthManagerImpl;
}());
exports.AuthManagerImpl = AuthManagerImpl;
