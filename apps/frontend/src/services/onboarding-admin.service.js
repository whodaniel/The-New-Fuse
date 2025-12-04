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
import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../config/api';
var API_ENDPOINT = "".concat(API_BASE_URL, "/api/admin/onboarding");
/**
 * Service for managing onboarding configuration settings
 */
export var OnboardingAdminService = {
    /**
     * Get general onboarding settings
     */
    getGeneralSettings: function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios.get("".concat(API_ENDPOINT, "/general"), {
                                timeout: API_TIMEOUT,
                                headers: {
                                    'Authorization': "Bearer ".concat(localStorage.getItem('auth_token'))
                                }
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                    case 2:
                        error_1 = _a.sent();
                        console.error('Error getting general onboarding settings:', error_1);
                        throw error_1;
                    case 3: return [2 /*return*/];
                }
            });
        });
    },
    /**
     * Update general onboarding settings
     */
    updateGeneralSettings: function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios.put("".concat(API_ENDPOINT, "/general"), data, {
                                timeout: API_TIMEOUT,
                                headers: {
                                    'Authorization': "Bearer ".concat(localStorage.getItem('auth_token'))
                                }
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                    case 2:
                        error_2 = _a.sent();
                        console.error('Error updating general onboarding settings:', error_2);
                        throw error_2;
                    case 3: return [2 /*return*/];
                }
            });
        });
    },
    /**
     * Get user types configuration
     */
    getUserTypes: function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios.get("".concat(API_ENDPOINT, "/user-types"), {
                                timeout: API_TIMEOUT,
                                headers: {
                                    'Authorization': "Bearer ".concat(localStorage.getItem('auth_token'))
                                }
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                    case 2:
                        error_3 = _a.sent();
                        console.error('Error getting user types configuration:', error_3);
                        throw error_3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    },
    /**
     * Update user types configuration
     */
    updateUserTypes: function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios.put("".concat(API_ENDPOINT, "/user-types"), data, {
                                timeout: API_TIMEOUT,
                                headers: {
                                    'Authorization': "Bearer ".concat(localStorage.getItem('auth_token'))
                                }
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                    case 2:
                        error_4 = _a.sent();
                        console.error('Error updating user types configuration:', error_4);
                        throw error_4;
                    case 3: return [2 /*return*/];
                }
            });
        });
    },
    /**
     * Get onboarding steps configuration
     */
    getSteps: function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios.get("".concat(API_ENDPOINT, "/steps"), {
                                timeout: API_TIMEOUT,
                                headers: {
                                    'Authorization': "Bearer ".concat(localStorage.getItem('auth_token'))
                                }
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                    case 2:
                        error_5 = _a.sent();
                        console.error('Error getting onboarding steps configuration:', error_5);
                        throw error_5;
                    case 3: return [2 /*return*/];
                }
            });
        });
    },
    /**
     * Update onboarding steps configuration
     */
    updateSteps: function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios.put("".concat(API_ENDPOINT, "/steps"), data, {
                                timeout: API_TIMEOUT,
                                headers: {
                                    'Authorization': "Bearer ".concat(localStorage.getItem('auth_token'))
                                }
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                    case 2:
                        error_6 = _a.sent();
                        console.error('Error updating onboarding steps configuration:', error_6);
                        throw error_6;
                    case 3: return [2 /*return*/];
                }
            });
        });
    },
    /**
     * Get AI settings for onboarding
     */
    getAISettings: function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios.get("".concat(API_ENDPOINT, "/ai-settings"), {
                                timeout: API_TIMEOUT,
                                headers: {
                                    'Authorization': "Bearer ".concat(localStorage.getItem('auth_token'))
                                }
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                    case 2:
                        error_7 = _a.sent();
                        console.error('Error getting AI settings for onboarding:', error_7);
                        throw error_7;
                    case 3: return [2 /*return*/];
                }
            });
        });
    },
    /**
     * Update AI settings for onboarding
     */
    updateAISettings: function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios.put("".concat(API_ENDPOINT, "/ai-settings"), data, {
                                timeout: API_TIMEOUT,
                                headers: {
                                    'Authorization': "Bearer ".concat(localStorage.getItem('auth_token'))
                                }
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                    case 2:
                        error_8 = _a.sent();
                        console.error('Error updating AI settings for onboarding:', error_8);
                        throw error_8;
                    case 3: return [2 /*return*/];
                }
            });
        });
    },
    /**
     * Validate onboarding configuration
     */
    validateConfiguration: function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios.post("".concat(API_ENDPOINT, "/validate"), {}, {
                                timeout: API_TIMEOUT,
                                headers: {
                                    'Authorization': "Bearer ".concat(localStorage.getItem('auth_token'))
                                }
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                    case 2:
                        error_9 = _a.sent();
                        console.error('Error validating onboarding configuration:', error_9);
                        throw error_9;
                    case 3: return [2 /*return*/];
                }
            });
        });
    },
    /**
     * Get onboarding analytics
     */
    getAnalytics: function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios.get("".concat(API_ENDPOINT, "/analytics"), {
                                timeout: API_TIMEOUT,
                                headers: {
                                    'Authorization': "Bearer ".concat(localStorage.getItem('auth_token'))
                                }
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                    case 2:
                        error_10 = _a.sent();
                        console.error('Error getting onboarding analytics:', error_10);
                        throw error_10;
                    case 3: return [2 /*return*/];
                }
            });
        });
    }
};
