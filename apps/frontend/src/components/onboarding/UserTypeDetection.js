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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import axios from 'axios';
export var UserTypeDetection = function (_a) {
    var onDetectionComplete = _a.onDetectionComplete;
    var _b = useState(true), loading = _b[0], setLoading = _b[1];
    var _c = useState(null), error = _c[0], setError = _c[1];
    var _d = useState([
        { name: 'Analyzing connection', complete: false },
        { name: 'Checking authentication method', complete: false },
        { name: 'Analyzing request patterns', complete: false },
        { name: 'Determining user type', complete: false }
    ]), detectionSteps = _d[0], setDetectionSteps = _d[1];
    useEffect(function () {
        var detectUserType = function () { return __awaiter(void 0, void 0, void 0, function () {
            var response, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, 7, 8]);
                        // Update first step
                        setDetectionSteps(function (prev) {
                            var updated = __spreadArray([], prev, true);
                            updated[0].complete = true;
                            return updated;
                        });
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                    case 1:
                        _a.sent();
                        // Update second step
                        setDetectionSteps(function (prev) {
                            var updated = __spreadArray([], prev, true);
                            updated[1].complete = true;
                            return updated;
                        });
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, axios.post('/api/onboarding/start')];
                    case 3:
                        response = _a.sent();
                        // Update third step
                        setDetectionSteps(function (prev) {
                            var updated = __spreadArray([], prev, true);
                            updated[2].complete = true;
                            return updated;
                        });
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                    case 4:
                        _a.sent();
                        // Update fourth step
                        setDetectionSteps(function (prev) {
                            var updated = __spreadArray([], prev, true);
                            updated[3].complete = true;
                            return updated;
                        });
                        // Small delay for visual feedback
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                    case 5:
                        // Small delay for visual feedback
                        _a.sent();
                        // Call the callback with the detected user type
                        onDetectionComplete(response.data.userType);
                        return [3 /*break*/, 8];
                    case 6:
                        err_1 = _a.sent();
                        console.error('Error detecting user type:', err_1);
                        setError('Failed to detect user type. Please try again.');
                        // Default to human if detection fails
                        onDetectionComplete('human');
                        return [3 /*break*/, 8];
                    case 7:
                        setLoading(false);
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
                }
            });
        }); };
        // Use simulation for demo
        // const simulateDetection = async () => {
        //   try {
        //     // Update first step
        //     setDetectionSteps(prev => {
        //       const updated = [...prev];
        //       updated[0].complete = true;
        //       return updated;
        //     });
        //     await new Promise(resolve => setTimeout(resolve, 800));
        //     // Update second step
        //     setDetectionSteps(prev => {
        //       const updated = [...prev];
        //       updated[1].complete = true;
        //       return updated;
        //     });
        //     await new Promise(resolve => setTimeout(resolve, 800));
        //     // Update third step
        //     setDetectionSteps(prev => {
        //       const updated = [...prev];
        //       updated[2].complete = true;
        //       return updated;
        //     });
        //     await new Promise(resolve => setTimeout(resolve, 800));
        //     // Update fourth step
        //     setDetectionSteps(prev => {
        //       const updated = [...prev];
        //       updated[3].complete = true;
        //       return updated;
        //     });
        //     // Small delay for visual feedback
        //     await new Promise(resolve => setTimeout(resolve, 800));
        //     // For demo purposes, randomly select user type with bias toward human
        //     const userType = Math.random() > 0.8 ? 'ai_agent' : 'human';
        //     onDetectionComplete(userType);
        //   } catch (err) {
        //     console.error('Error in simulation:', err);
        //     setError('Failed to detect user type. Please try again.');
        //     // Default to human if detection fails
        //     onDetectionComplete('human');
        //   } finally {
        //     setLoading(false);
        //   }
        // };
        // Use simulation for demo
        // simulateDetection();
        // Use real detection in production
        detectUserType();
    }, [onDetectionComplete]);
    var completedSteps = detectionSteps.filter(function (step) { return step.complete; }).length;
    var progressValue = (completedSteps / detectionSteps.length) * 100;
    return (_jsxs("div", { className: "max-w-2xl mx-auto p-6 text-center", children: [_jsx("h1", { className: "text-3xl font-bold mb-6", children: "Detecting User Type" }), error && (_jsxs("div", { className: "bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center", children: [_jsx("svg", { className: "w-5 h-5 mr-2", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z", clipRule: "evenodd" }) }), error] })), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2 mb-8", children: _jsx("div", { className: "bg-blue-600 h-2 rounded-full transition-all duration-300", style: { width: "".concat(progressValue, "%") } }) }), _jsx("div", { className: "space-y-4 text-left mb-6", children: detectionSteps.map(function (step, index) { return (_jsxs("div", { className: "flex items-center", children: [step.complete ? (_jsx("div", { className: "text-green-500 mr-3", children: "\u2713" })) : (index === detectionSteps.findIndex(function (s) { return !s.complete; }) ? (_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3" })) : (_jsx("div", { className: "mr-3", children: "\u25CB" }))), _jsx("span", { className: step.complete ? 'text-green-500' : 'text-gray-500', children: step.name })] }, index)); }) }), _jsx("p", { className: "text-gray-600", children: loading
                    ? 'Please wait while we analyze your connection...'
                    : 'Detection complete. Redirecting to appropriate onboarding flow...' })] }));
};
