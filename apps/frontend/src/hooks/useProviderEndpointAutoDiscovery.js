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
import System from "@/models/system";
import showToast from "@/utils/toast";
export default function useProviderEndpointAutoDiscovery(_a) {
    var _b = _a.provider, provider = _b === void 0 ? null : _b, _c = _a.initialBasePath, initialBasePath = _c === void 0 ? "" : _c, _d = _a.ENDPOINTS, ENDPOINTS = _d === void 0 ? [] : _d;
    var _e = useState(false), loading = _e[0], setLoading = _e[1];
    var _f = useState(initialBasePath), basePath = _f[0], setBasePath = _f[1];
    var _g = useState(initialBasePath), basePathValue = _g[0], setBasePathValue = _g[1];
    var _h = useState(false), autoDetectAttempted = _h[0], setAutoDetectAttempted = _h[1];
    var _j = useState(true), showAdvancedControls = _j[0], setShowAdvancedControls = _j[1];
    function autoDetect() {
        return __awaiter(this, arguments, void 0, function (isInitialAttempt) {
            var possibleEndpoints, _a, endpoint, models;
            if (isInitialAttempt === void 0) { isInitialAttempt = false; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        setLoading(true);
                        setAutoDetectAttempted(true);
                        possibleEndpoints = [];
                        ENDPOINTS.forEach(function (endpoint) {
                            possibleEndpoints.push(new Promise(function (resolve, reject) {
                                System.customModels(provider, null, endpoint, 2000)
                                    .then(function (results) {
                                    if (!(results === null || results === void 0 ? void 0 : results.models) || results.models.length === 0)
                                        throw new Error("No models");
                                    resolve({ endpoint: endpoint, models: results.models });
                                })
                                    .catch(function () {
                                    reject("".concat(provider, " @ ").concat(endpoint, " did not resolve."));
                                });
                            }));
                        });
                        return [4 /*yield*/, Promise.any(possibleEndpoints)
                                .then(function (resolved) { return resolved; })
                                .catch(function () {
                                console.error("All endpoints failed to resolve.");
                                return { endpoint: null, models: null };
                            })];
                    case 1:
                        _a = _b.sent(), endpoint = _a.endpoint, models = _a.models;
                        if (models !== null) {
                            setBasePath(endpoint);
                            setBasePathValue(endpoint);
                            setLoading(false);
                            showToast("Provider endpoint discovered automatically.", "success", {
                                clear: true,
                            });
                            setShowAdvancedControls(false);
                            return [2 /*return*/];
                        }
                        setLoading(false);
                        setShowAdvancedControls(true);
                        showToast("Couldn't automatically discover the provider endpoint. Please enter it manually.", "info", { clear: true });
                        return [2 /*return*/];
                }
            });
        });
    }
    function handleAutoDetectClick(e) {
        e.preventDefault();
        autoDetect();
    }
    function handleBasePathChange(e) {
        var value = e.target.value;
        setBasePathValue(value);
    }
    function handleBasePathBlur() {
        setBasePath(basePathValue);
    }
    useEffect(function () {
        if (!initialBasePath && !autoDetectAttempted)
            autoDetect(true);
    }, [initialBasePath, autoDetectAttempted]);
    return {
        autoDetecting: loading,
        autoDetectAttempted: autoDetectAttempted,
        showAdvancedControls: showAdvancedControls,
        setShowAdvancedControls: setShowAdvancedControls,
        basePath: {
            value: basePath,
            set: setBasePathValue,
            onChange: handleBasePathChange,
            onBlur: handleBasePathBlur,
        },
        basePathValue: {
            value: basePathValue,
            set: setBasePathValue,
        },
        handleAutoDetectClick: handleAutoDetectClick,
        runAutoDetect: autoDetect,
    };
}
