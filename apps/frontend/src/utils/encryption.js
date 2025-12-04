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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.verifyMessageSignature = exports.createMessageSignature = exports.E2EEncryption = exports.MessageEncryption = void 0;
// NOTE: This is a browser-only file. For all Node.js/server cryptography, use src/utils/cryptoUtils.ts exclusively.
// If you need browser crypto, consider using the Web Crypto API or a browser polyfill, and document it here.
import crypto_js_1 from 'crypto-js';
// Deprecated: Use centralized cryptoUtils.ts for all Node/server cryptography.
var MessageEncryption = /** @class */ (function () {
    function MessageEncryption(encryptionKey) {
        this.key = encryptionKey;
    }
    MessageEncryption.prototype.encrypt = function (message) {
        try {
            return crypto_js_1.default.AES.encrypt(message, this.key).toString();
        }
        catch (error) {
            console.error('Encryption error:', error);
            throw new Error('Failed to encrypt message');
        }
    };
    MessageEncryption.prototype.decrypt = function (encryptedMessage) {
        try {
            var bytes = crypto_js_1.default.AES.decrypt(encryptedMessage, this.key);
            return bytes.toString(crypto_js_1.default.enc.Utf8);
        }
        catch (error) {
            console.error('Decryption error:', error);
            throw new Error('Failed to decrypt message');
        }
    };
    MessageEncryption.generateKey = function () {
        // For browser, use Web Crypto API if possible. This is legacy.
        return crypto_js_1.default.lib.WordArray.random(32).toString();
    };
    MessageEncryption.createRoomKey = function (roomId, userIds) {
        var sortedUserIds = __spreadArray([], userIds, true).sort().join('-');
        var baseString = "".concat(roomId, "-").concat(sortedUserIds);
        // For browser, use Web Crypto API if possible. This is legacy.
        return crypto_js_1.default.SHA256(baseString).toString();
    };
    return MessageEncryption;
}());
exports.MessageEncryption = MessageEncryption;
var E2EEncryption = /** @class */ (function () {
    function E2EEncryption() {
        this.keyPair = null;
    }
    E2EEncryption.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        _a = this;
                        return [4 /*yield*/, window.crypto.subtle.generateKey({
                                name: 'RSA-OAEP',
                                modulusLength: 2048,
                                publicExponent: new Uint8Array([1, 0, 1]),
                                hash: 'SHA-256',
                            }, true, ['encrypt', 'decrypt'])];
                    case 1:
                        _a.keyPair = _b.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _b.sent();
                        console.error('E2E initialization error:', error_1);
                        throw new Error('Failed to initialize E2E encryption');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    E2EEncryption.prototype.exportPublicKey = function () {
        return __awaiter(this, void 0, void 0, function () {
            var keyPair, exported, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        keyPair = this.keyPair;
                        if (!(keyPair === null || keyPair === void 0 ? void 0 : keyPair.publicKey)) {
                            throw new Error('E2E encryption not initialized');
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, window.crypto.subtle.exportKey('spki', this.keyPair.publicKey)];
                    case 2:
                        exported = _a.sent();
                        return [2 /*return*/, window.btoa(String.fromCharCode.apply(String, new Uint8Array(exported)))];
                    case 3:
                        error_2 = _a.sent();
                        console.error('Public key export error:', error_2);
                        throw new Error('Failed to export public key');
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    E2EEncryption.prototype.encryptForRecipient = function (data, recipientPublicKey) {
        return __awaiter(this, void 0, void 0, function () {
            var publicKey, encoded, encrypted, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, window.crypto.subtle.importKey('spki', Uint8Array.from(atob(recipientPublicKey), function (c) { return c.charCodeAt(0); }), {
                                name: 'RSA-OAEP',
                                hash: 'SHA-256',
                            }, true, ['encrypt'])];
                    case 1:
                        publicKey = _a.sent();
                        encoded = new TextEncoder().encode(data);
                        return [4 /*yield*/, window.crypto.subtle.encrypt({
                                name: 'RSA-OAEP',
                            }, publicKey, encoded)];
                    case 2:
                        encrypted = _a.sent();
                        return [2 /*return*/, window.btoa(String.fromCharCode.apply(String, new Uint8Array(encrypted)))];
                    case 3:
                        error_3 = _a.sent();
                        console.error('E2E encryption error:', error_3);
                        throw new Error('Failed to encrypt data for recipient');
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    E2EEncryption.prototype.decrypt = function (encryptedData) {
        return __awaiter(this, void 0, void 0, function () {
            var keyPair, encrypted, decrypted, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        keyPair = this.keyPair;
                        if (!(keyPair === null || keyPair === void 0 ? void 0 : keyPair.privateKey)) {
                            throw new Error('E2E encryption not initialized');
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        encrypted = Uint8Array.from(atob(encryptedData), function (c) { return c.charCodeAt(0); });
                        return [4 /*yield*/, window.crypto.subtle.decrypt({
                                name: 'RSA-OAEP',
                            }, this.keyPair.privateKey, encrypted)];
                    case 2:
                        decrypted = _a.sent();
                        return [2 /*return*/, new TextDecoder().decode(decrypted)];
                    case 3:
                        error_4 = _a.sent();
                        console.error('E2E decryption error:', error_4);
                        throw new Error('Failed to decrypt data');
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return E2EEncryption;
}());
exports.E2EEncryption = E2EEncryption;
var createMessageSignature = function (message, userId) {
    return crypto_js_1.default.HmacSHA256(message, userId).toString();
};
exports.createMessageSignature = createMessageSignature;
var verifyMessageSignature = function (message, signature, userId) {
    var computedSignature = (0, exports.createMessageSignature)(message, userId);
    return computedSignature === signature;
};
exports.verifyMessageSignature = verifyMessageSignature;
