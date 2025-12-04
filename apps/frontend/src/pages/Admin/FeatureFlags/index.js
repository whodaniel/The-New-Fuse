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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { FeatureFlagConditionsEditor } from '../../../components/AdminPanel/FeatureFlagConditions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/toast';
import { Switch } from '@/components/ui/switch';
import { Tabs } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
export default function FeatureFlagsAdmin() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    var _l = useState([]), features = _l[0], setFeatures = _l[1];
    var _m = useState(true), loading = _m[0], setLoading = _m[1];
    var _o = useState(null), selectedFeature = _o[0], setSelectedFeature = _o[1];
    var _p = useState({}), editingConditions = _p[0], setEditingConditions = _p[1];
    useEffect(function () {
        loadFeatures();
    }, []);
    function loadFeatures() {
        return __awaiter(this, void 0, void 0, function () {
            var response, data, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, 4, 5]);
                        return [4 /*yield*/, fetch('/api/admin/features')];
                    case 1:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        setFeatures(data);
                        return [3 /*break*/, 5];
                    case 3:
                        error_1 = _a.sent();
                        toast.error('Failed to load features');
                        console.error(error_1);
                        return [3 /*break*/, 5];
                    case 4:
                        setLoading(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    function createFeature(data) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch('/api/admin/features', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(data)
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok)
                            throw new Error('Failed to create feature');
                        toast.success('Feature created successfully');
                        return [4 /*yield*/, loadFeatures()];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        toast.error('Failed to create feature');
                        console.error(error_2);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    function updateFeature(id, data) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("/api/admin/features/".concat(id), {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(data)
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok)
                            throw new Error('Failed to update feature');
                        toast.success('Feature updated successfully');
                        return [4 /*yield*/, loadFeatures()];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_3 = _a.sent();
                        toast.error('Failed to update feature');
                        console.error(error_3);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    function deleteFeature(id) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!confirm('Are you sure you want to delete this feature?'))
                            return [2 /*return*/];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, fetch("/api/admin/features/".concat(id), {
                                method: 'DELETE'
                            })];
                    case 2:
                        response = _a.sent();
                        if (!response.ok)
                            throw new Error('Failed to delete feature');
                        toast.success('Feature deleted successfully');
                        return [4 /*yield*/, loadFeatures()];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_4 = _a.sent();
                        toast.error('Failed to delete feature');
                        console.error(error_4);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    if (loading) {
        return _jsx("div", { children: "Loading features..." });
    }
    return (_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Feature Flags" }), _jsx(Button, { onClick: function () { return setSelectedFeature({
                            name: '',
                            description: '',
                            enabled: false,
                            stage: 'development',
                            priority: 'medium',
                            conditions: {}
                        }); }, children: "Create Feature" })] }), _jsxs("div", { className: "grid gap-6 grid-cols-1 lg:grid-cols-2", children: [_jsxs(Card, { className: "p-4", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Feature List" }), _jsx("div", { className: "space-y-4", children: features.map(function (feature) { return (_jsxs(Card, { className: "p-4 hover:bg-secondary/50 cursor-pointer", onClick: function () {
                                        setSelectedFeature(feature);
                                        setEditingConditions(feature.conditions || {});
                                    }, children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-medium", children: feature.name }), _jsx("p", { className: "text-sm text-muted-foreground", children: feature.description })] }), _jsx(Switch, { checked: feature.enabled, onCheckedChange: function (checked) { return updateFeature(feature.id, { enabled: checked }); }, onClick: function (e) { return e.stopPropagation(); } })] }), _jsxs("div", { className: "flex gap-2 mt-2 text-sm", children: [_jsx("span", { className: "bg-primary/10 px-2 py-1 rounded", children: feature.stage }), _jsx("span", { className: "bg-primary/10 px-2 py-1 rounded", children: feature.priority })] })] }, feature.id)); }) })] }), selectedFeature && (_jsxs(Card, { className: "p-4", children: [_jsxs("div", { className: "flex justify-between items-start mb-4", children: [_jsx("h2", { className: "text-xl font-semibold", children: selectedFeature.id ? 'Edit Feature' : 'New Feature' }), selectedFeature.id && (_jsx(Button, { variant: "destructive", size: "sm", onClick: function () { return deleteFeature(selectedFeature.id); }, children: "Delete" }))] }), _jsxs(Tabs, { defaultValue: "details", children: [_jsxs(Tabs.List, { children: [_jsx(Tabs.Trigger, { value: "details", children: "Details" }), _jsx(Tabs.Trigger, { value: "conditions", children: "Conditions" }), _jsx(Tabs.Trigger, { value: "metrics", children: "Metrics" })] }), _jsxs(Tabs.Content, { value: "details", className: "space-y-4 mt-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm mb-1", children: "Name" }), _jsx(Input, { value: selectedFeature.name, onChange: function (e) { return setSelectedFeature(__assign(__assign({}, selectedFeature), { name: e.target.value })); } })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm mb-1", children: "Description" }), _jsx(Input, { value: selectedFeature.description, onChange: function (e) { return setSelectedFeature(__assign(__assign({}, selectedFeature), { description: e.target.value })); } })] }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm mb-1", children: "Stage" }), _jsxs("select", { title: "Select an option", "aria-label": "Select an option", value: selectedFeature.stage, onChange: function (e) { return setSelectedFeature(__assign(__assign({}, selectedFeature), { stage: e.target.value })); }, className: "w-full p-2 border rounded", children: [_jsx("option", { value: "development", children: "Development" }), _jsx("option", { value: "testing", children: "Testing" }), _jsx("option", { value: "staging", children: "Staging" }), _jsx("option", { value: "production", children: "Production" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm mb-1", children: "Priority" }), _jsxs("select", { title: "Select an option", "aria-label": "Select an option", value: selectedFeature.priority, onChange: function (e) { return setSelectedFeature(__assign(__assign({}, selectedFeature), { priority: e.target.value })); }, className: "w-full p-2 border rounded", children: [_jsx("option", { value: "low", children: "Low" }), _jsx("option", { value: "medium", children: "Medium" }), _jsx("option", { value: "high", children: "High" })] })] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Switch, { checked: selectedFeature.enabled, onCheckedChange: function (checked) { return setSelectedFeature(__assign(__assign({}, selectedFeature), { enabled: checked })); } }), _jsx("span", { children: "Enabled" })] })] }), _jsx(Tabs.Content, { value: "conditions", className: "mt-4", children: _jsx(FeatureFlagConditionsEditor, { conditions: editingConditions, onChange: function (conditions) {
                                                setEditingConditions(conditions);
                                                setSelectedFeature(__assign(__assign({}, selectedFeature), { conditions: conditions }));
                                            } }) }), _jsx(Tabs.Content, { value: "metrics", className: "mt-4", children: selectedFeature.id ? (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs(Card, { className: "p-4", children: [_jsx("h4", { className: "font-medium mb-2", children: "Usage" }), _jsx("div", { className: "text-2xl font-bold", children: ((_b = (_a = selectedFeature.metadata) === null || _a === void 0 ? void 0 : _a.metrics) === null || _b === void 0 ? void 0 : _b.usageCount) || 0 })] }), _jsxs(Card, { className: "p-4", children: [_jsx("h4", { className: "font-medium mb-2", children: "Errors" }), _jsx("div", { className: "text-2xl font-bold text-destructive", children: ((_d = (_c = selectedFeature.metadata) === null || _c === void 0 ? void 0 : _c.metrics) === null || _d === void 0 ? void 0 : _d.errors) || 0 })] }), _jsxs(Card, { className: "p-4", children: [_jsx("h4", { className: "font-medium mb-2", children: "Exposures" }), _jsx("div", { className: "text-2xl font-bold", children: ((_f = (_e = selectedFeature.metadata) === null || _e === void 0 ? void 0 : _e.metrics) === null || _f === void 0 ? void 0 : _f.exposures) || 0 })] }), _jsxs(Card, { className: "p-4", children: [_jsx("h4", { className: "font-medium mb-2", children: "Positive Evaluations" }), _jsx("div", { className: "text-2xl font-bold text-success", children: ((_h = (_g = selectedFeature.metadata) === null || _g === void 0 ? void 0 : _g.metrics) === null || _h === void 0 ? void 0 : _h.positiveEvaluations) || 0 })] })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium mb-2", children: "Last Used" }), _jsx("div", { children: ((_k = (_j = selectedFeature.metadata) === null || _j === void 0 ? void 0 : _j.metrics) === null || _k === void 0 ? void 0 : _k.lastUsed)
                                                                ? new Date(selectedFeature.metadata.metrics.lastUsed).toLocaleString()
                                                                : 'Never' })] })] })) : (_jsx("div", { className: "text-muted-foreground", children: "Metrics will be available after creating the feature." })) })] }), _jsxs("div", { className: "flex justify-end mt-6 space-x-2", children: [_jsx(Button, { variant: "outline", onClick: function () {
                                            setSelectedFeature(null);
                                            setEditingConditions({});
                                        }, children: "Cancel" }), _jsx(Button, { onClick: function () {
                                            if (selectedFeature.id) {
                                                updateFeature(selectedFeature.id, __assign(__assign({}, selectedFeature), { conditions: editingConditions }));
                                            }
                                            else {
                                                createFeature(__assign(__assign({}, selectedFeature), { conditions: editingConditions }));
                                            }
                                            setSelectedFeature(null);
                                            setEditingConditions({});
                                        }, children: selectedFeature.id ? 'Update' : 'Create' })] })] }))] })] }));
}
