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
import { StateManager } from '../../domain/core/stateManager';
import { LoggingService } from '../../services/logging';
var ConfigService = /** @class */ (function () {
    function ConfigService() {
        this.config = null;
        this.eventBus = EventBus.getInstance();
        this.stateManager = StateManager.getInstance();
        this.logger = LoggingService.getInstance();
    }
    ConfigService.getInstance = function () {
        if (!ConfigService.instance) {
            ConfigService.instance = new ConfigService();
        }
        return ConfigService.instance;
    };
    ConfigService.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, config, error_1;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch('/api/config')];
                    case 1:
                        response = _d.sent();
                        if (!response.ok) {
                            throw new Error('Failed to fetch config');
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        config = _d.sent();
                        this.config = this.validateConfig(config);
                        this.stateManager.setState(['config'], this.config);
                        this.eventBus.emit('config_loaded', this.config, 'ConfigService');
                        return [2 /*return*/, { success: true, data: undefined }];
                    case 3:
                        error_1 = _d.sent();
                        this.logger.error('Failed to initialize config', error_1);
                        return [2 /*return*/, {
                                success: false,
                                error: {
                                    code: 'CONFIG_INIT_FAILED',
                                    message: 'Failed to initialize configuration',
                                    details: error_1
                                }
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    ConfigService.prototype.validateConfig = function (config) {
        var requiredFields = ['apiUrl', 'wsUrl', 'environment', 'version'];
        for (var _i = 0, requiredFields_1 = requiredFields; _i < requiredFields_1.length; _i++) {
            var field = requiredFields_1[_i];
            if (!(field in config)) {
                throw new Error("Missing required config field: ".concat(field));
            }
        }
        if (!['development', 'staging', 'production'].includes(config.environment)) {
            throw new Error('Invalid environment value');
        }
        return {
            apiUrl: config.apiUrl,
            wsUrl: config.wsUrl,
            environment: config.environment,
            version: config.version,
            features: config.features || {},
            settings: config.settings || {}
        };
    };
    ConfigService.prototype.getConfig = function () {
        if (!this.config) {
            throw new Error('Config not initialized');
        }
        return Object.assign({}, this.config);
    };
    ConfigService.prototype.isFeatureEnabled = function (featureKey) {
        var _a, _b;
        return ((_b = (_a = this.config) === null || _a === void 0 ? void 0 : _a.features) === null || _b === void 0 ? void 0 : _b[featureKey]) || false;
    };
    ConfigService.prototype.getSetting = function (key, defaultValue) {
        var _a, _b, _c;
        return (_c = (_b = (_a = this.config) === null || _a === void 0 ? void 0 : _a.settings) === null || _b === void 0 ? void 0 : _b[key]) !== null && _c !== void 0 ? _c : defaultValue;
    };
    ConfigService.prototype.updateSetting = function (key, value) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_2;
            var _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fetch('/api/config/settings', {
                                method: 'PATCH',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ key: key, value: value })
                            })];
                    case 1:
                        response = _e.sent();
                        if (!response.ok) {
                            throw new Error('Failed to update setting');
                        }
                        if (this.config) {
                            this.config.settings = Object.assign(Object.assign({}, this.config.settings), (_d = {}, _d[key] = value, _d));
                            this.stateManager.setState(['config', 'settings', key], value);
                        }
                        this.eventBus.emit('setting_updated', { key: key, value: value }, 'ConfigService');
                        return [2 /*return*/, { success: true, data: undefined }];
                    case 2:
                        error_2 = _e.sent();
                        this.logger.error('Failed to update setting', error_2);
                        return [2 /*return*/, {
                                success: false,
                                error: {
                                    code: 'SETTING_UPDATE_FAILED',
                                    message: 'Failed to update setting',
                                    details: error_2
                                }
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ConfigService.prototype.isDevelopment = function () {
        var _a;
        return ((_a = this.config) === null || _a === void 0 ? void 0 : _a.environment) === 'development';
    };
    ConfigService.prototype.isStaging = function () {
        var _a;
        return ((_a = this.config) === null || _a === void 0 ? void 0 : _a.environment) === 'staging';
    };
    ConfigService.prototype.isProduction = function () {
        var _a;
        return ((_a = this.config) === null || _a === void 0 ? void 0 : _a.environment) === 'production';
    };
    ConfigService.prototype.getVersion = function () {
        var _a;
        return ((_a = this.config) === null || _a === void 0 ? void 0 : _a.version) || '0.0.0';
    };
    ConfigService.prototype.subscribeToConfig = function (callback) {
        return this.stateManager.subscribe(['config'], callback);
    };
    ConfigService.prototype.subscribeToSetting = function (key, callback) {
        return this.stateManager.subscribe(['config', 'settings', key], callback);
    };
    return ConfigService;
}());
export { ConfigService };
