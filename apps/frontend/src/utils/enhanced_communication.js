var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
import { Logger } from './logger';
var logger = new Logger('EnhancedCommunicationBus');
var EnhancedCommunicationBus = /** @class */ (function (_super) {
    __extends(EnhancedCommunicationBus, _super);
    function EnhancedCommunicationBus(options) {
        if (options === void 0) { options = {}; }
        var _a, _b, _c;
        var _this = _super.call(this) || this;
        _this.options = {
            retryAttempts: (_a = options.retryAttempts) !== null && _a !== void 0 ? _a : 3,
            retryDelay: (_b = options.retryDelay) !== null && _b !== void 0 ? _b : 1000,
            timeout: (_c = options.timeout) !== null && _c !== void 0 ? _c : 5000
        };
        _this.activePublications = new Map();
        return _this;
    }
    EnhancedCommunicationBus.prototype.publish = function (topic_1, message_1) {
        return __awaiter(this, arguments, void 0, function (topic, message, options) {
            var publication, timeoutId, error_1, errorDetails;
            var _this = this;
            var _a, _b;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        publication = {
                            id: this.generateId(),
                            topic: topic,
                            message: message,
                            timestamp: new Date().toISOString(),
                            priority: (_a = options.priority) !== null && _a !== void 0 ? _a : 'normal',
                            metadata: options.metadata
                        };
                        timeoutId = setTimeout(function () {
                            _this.handlePublicationTimeout(publication.id);
                        }, (_b = options.expiration) !== null && _b !== void 0 ? _b : this.options.timeout);
                        this.activePublications.set(publication.id, timeoutId);
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.attemptPublish(publication, this.options.retryAttempts)];
                    case 2:
                        _c.sent();
                        this.activePublications.delete(publication.id);
                        clearTimeout(timeoutId);
                        this.emit('published', publication);
                        logger.debug('Publication successful', { publicationId: publication.id });
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _c.sent();
                        this.activePublications.delete(publication.id);
                        clearTimeout(timeoutId);
                        errorDetails = {
                            publication: publication,
                            error: error_1 instanceof Error ? error_1.message : String(error_1)
                        };
                        this.emit('error', errorDetails);
                        logger.error('Publication failed', errorDetails);
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    EnhancedCommunicationBus.prototype.attemptPublish = function (publication, remainingAttempts) {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 5]);
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                    case 1:
                        _a.sent();
                        this.emit('published', publication);
                        logger.debug('Publish attempt successful', {
                            publicationId: publication.id,
                            remainingAttempts: remainingAttempts
                        });
                        return [3 /*break*/, 5];
                    case 2:
                        error_2 = _a.sent();
                        logger.warn('Publish attempt failed', {
                            publicationId: publication.id,
                            remainingAttempts: remainingAttempts,
                            error: error_2 instanceof Error ? error_2.message : String(error_2)
                        });
                        if (!(remainingAttempts > 0)) return [3 /*break*/, 4];
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, _this.options.retryDelay); })];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, this.attemptPublish(publication, remainingAttempts - 1)];
                    case 4: throw error_2;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    EnhancedCommunicationBus.prototype.handlePublicationTimeout = function (publicationId) {
        var timeoutId = this.activePublications.get(publicationId);
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.activePublications.delete(publicationId);
            this.emit('timeout', { publicationId: publicationId });
            logger.warn('Publication timeout', { publicationId: publicationId });
        }
    };
    EnhancedCommunicationBus.prototype.generateId = function () {
        var timestamp = Date.now().toString(36);
        var randomStr = Math.random().toString(36).substring(2, 15);
        return "".concat(timestamp, "_").concat(randomStr);
    };
    EnhancedCommunicationBus.prototype.emit = function (event) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return _super.prototype.emit.apply(this, __spreadArray([event], args, false));
    };
    EnhancedCommunicationBus.prototype.on = function (event, listener) {
        return _super.prototype.on.call(this, event, listener);
    };
    EnhancedCommunicationBus.prototype.off = function (event, listener) {
        return _super.prototype.off.call(this, event, listener);
    };
    EnhancedCommunicationBus.prototype.once = function (event, listener) {
        return _super.prototype.once.call(this, event, listener);
    };
    return EnhancedCommunicationBus;
}(EventEmitter));
export { EnhancedCommunicationBus };
