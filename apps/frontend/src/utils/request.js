var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
export function userFromStorage() {
    if (typeof window === 'undefined')
        return null;
    var user = localStorage.getItem('user');
    if (!user)
        return null;
    try {
        return JSON.parse(user);
    }
    catch (_a) {
        return null;
    }
}
export function request(endpoint_1) {
    return __awaiter(this, arguments, void 0, function (endpoint, config) {
        var _a, params, _b, requiresAuth, _c, customHeaders, restConfig, queryString, url, headers, user, response, error, contentType, error_1;
        if (config === void 0) { config = {}; }
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _a = config.params, params = _a === void 0 ? {} : _a, _b = config.requiresAuth, requiresAuth = _b === void 0 ? true : _b, _c = config.headers, customHeaders = _c === void 0 ? {} : _c, restConfig = __rest(config, ["params", "requiresAuth", "headers"]);
                    queryString = new URLSearchParams(params).toString();
                    url = "".concat(endpoint).concat(queryString ? "?".concat(queryString) : '');
                    headers = __assign({ 'Content-Type': 'application/json' }, customHeaders);
                    if (requiresAuth) {
                        user = userFromStorage();
                        if (user === null || user === void 0 ? void 0 : user.uid) {
                            headers['Authorization'] = "Bearer ".concat(user.uid);
                        }
                    }
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 8, , 9]);
                    return [4 /*yield*/, fetch(url, __assign({ headers: headers }, restConfig))];
                case 2:
                    response = _d.sent();
                    if (!!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json()];
                case 3:
                    error = _d.sent();
                    throw new Error(error.message || 'Request failed');
                case 4:
                    contentType = response.headers.get('content-type');
                    if (!(contentType && contentType.includes('application/json'))) return [3 /*break*/, 6];
                    return [4 /*yield*/, response.json()];
                case 5: return [2 /*return*/, _d.sent()];
                case 6: return [4 /*yield*/, response.text()];
                case 7: return [2 /*return*/, _d.sent()];
                case 8:
                    error_1 = _d.sent();
                    console.error('Request failed:', error_1);
                    throw error_1;
                case 9: return [2 /*return*/];
            }
        });
    });
}
export function uploadFile(endpoint, file, onProgress) {
    return __awaiter(this, void 0, void 0, function () {
        var formData, xhr_1;
        return __generator(this, function (_a) {
            formData = new FormData();
            formData.append('file', file);
            try {
                xhr_1 = new XMLHttpRequest();
                if (onProgress) {
                    xhr_1.upload.onprogress = function (event) {
                        if (event.lengthComputable) {
                            var progress = (event.loaded / event.total) * 100;
                            onProgress(progress);
                        }
                    };
                }
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        xhr_1.open('POST', endpoint);
                        var user = userFromStorage();
                        if (user === null || user === void 0 ? void 0 : user.uid) {
                            xhr_1.setRequestHeader('Authorization', "Bearer ".concat(user.uid));
                        }
                        xhr_1.onload = function () {
                            if (xhr_1.status >= 200 && xhr_1.status < 300) {
                                try {
                                    var response = JSON.parse(xhr_1.responseText);
                                    resolve(response);
                                }
                                catch (_a) {
                                    resolve(xhr_1.responseText);
                                }
                            }
                            else {
                                reject(new Error('Upload failed'));
                            }
                        };
                        xhr_1.onerror = function () { return reject(new Error('Upload failed')); };
                        xhr_1.send(formData);
                    })];
            }
            catch (error) {
                console.error('Upload failed:', error);
                throw error;
            }
            return [2 /*return*/];
        });
    });
}
export function get(url, options) {
    return request(url, __assign(__assign({}, options), { method: 'GET' }));
}
export function post(url, data, options) {
    return request(url, __assign(__assign({}, options), { method: 'POST', body: data ? JSON.stringify(data) : undefined }));
}
export function put(url, data, options) {
    return request(url, __assign(__assign({}, options), { method: 'PUT', body: data ? JSON.stringify(data) : undefined }));
}
export function del(url, options) {
    return request(url, __assign(__assign({}, options), { method: 'DELETE' }));
}
export default {
    request: request,
    get: get,
    post: post,
    put: put,
    delete: del,
    uploadFile: uploadFile,
};
