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
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
// import { MonacoEditor } from '@the-new-fuse/ui-consolidated';
// Temporary placeholder components
var DatePicker = function (_a) {
    var value = _a.value, onChange = _a.onChange;
    return (_jsx("input", { type: "date", value: value ? value.toISOString().split('T')[0] : '', onChange: function (e) { return onChange(e.target.value ? new Date(e.target.value) : null); }, className: "px-3 py-2 border border-gray-300 rounded-md" }));
};
var Select = function (_a) {
    var value = _a.value, onChange = _a.onChange, options = _a.options;
    return (_jsx("select", { value: value, onChange: function (e) { return onChange(e.target.value); }, className: "px-3 py-2 border border-gray-300 rounded-md", children: options.map(function (option) { return (_jsx("option", { value: option.value, children: option.label }, option.value)); }) }));
};
export function FeatureFlagConditionsEditor(_a) {
    var _b, _c, _d, _e, _f;
    var conditions = _a.conditions, onChange = _a.onChange;
    var _g = useState('environments'), activeTab = _g[0], setActiveTab = _g[1];
    var updateConditions = function (key, value) {
        var _a;
        onChange(__assign(__assign({}, conditions), (_a = {}, _a[key] = value, _a)));
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex space-x-2 mb-4", children: [_jsx(Button, { variant: activeTab === 'environments' ? 'default' : 'outline', onClick: function () { return setActiveTab('environments'); }, children: "Environments" }), _jsx(Button, { variant: activeTab === 'userGroups' ? 'default' : 'outline', onClick: function () { return setActiveTab('userGroups'); }, children: "User Groups" }), _jsx(Button, { variant: activeTab === 'percentage' ? 'default' : 'outline', onClick: function () { return setActiveTab('percentage'); }, children: "Percentage" }), _jsx(Button, { variant: activeTab === 'dateRange' ? 'default' : 'outline', onClick: function () { return setActiveTab('dateRange'); }, children: "Date Range" }), _jsx(Button, { variant: activeTab === 'deviceTypes' ? 'default' : 'outline', onClick: function () { return setActiveTab('deviceTypes'); }, children: "Device Types" }), _jsx(Button, { variant: activeTab === 'customRules' ? 'default' : 'outline', onClick: function () { return setActiveTab('customRules'); }, children: "Custom Rules" })] }), activeTab === 'environments' && (_jsxs(Card, { className: "p-4", children: [_jsx("h3", { className: "text-lg font-medium mb-4", children: "Environment Targeting" }), _jsx("div", { className: "space-y-2", children: ['development', 'testing', 'staging', 'production'].map(function (env) { return (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Switch, { checked: (conditions.environments || []).includes(env), onCheckedChange: function (checked) {
                                        var environments = new Set(conditions.environments || []);
                                        if (checked) {
                                            environments.add(env);
                                        }
                                        else {
                                            environments.delete(env);
                                        }
                                        updateConditions('environments', Array.from(environments));
                                    } }), _jsx("span", { className: "capitalize", children: env })] }, env)); }) })] })), activeTab === 'userGroups' && (_jsxs(Card, { className: "p-4", children: [_jsx("h3", { className: "text-lg font-medium mb-4", children: "User Group Targeting" }), _jsxs("div", { className: "space-y-4", children: [(conditions.userGroups || []).map(function (group, index) { return (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Input, { placeholder: "Group ID", value: group.groupId, onChange: function (e) {
                                            var userGroups = __spreadArray([], (conditions.userGroups || []), true);
                                            userGroups[index] = __assign(__assign({}, group), { groupId: e.target.value });
                                            updateConditions('userGroups', userGroups);
                                        } }), _jsx(Input, { placeholder: "Group Name", value: group.name, onChange: function (e) {
                                            var userGroups = __spreadArray([], (conditions.userGroups || []), true);
                                            userGroups[index] = __assign(__assign({}, group), { name: e.target.value });
                                            updateConditions('userGroups', userGroups);
                                        } }), _jsx(Button, { variant: "destructive", onClick: function () {
                                            var userGroups = __spreadArray([], (conditions.userGroups || []), true);
                                            userGroups.splice(index, 1);
                                            updateConditions('userGroups', userGroups);
                                        }, children: "Remove" })] }, index)); }), _jsx(Button, { onClick: function () {
                                    var userGroups = __spreadArray([], (conditions.userGroups || []), true);
                                    userGroups.push({ groupId: '', name: '' });
                                    updateConditions('userGroups', userGroups);
                                }, children: "Add Group" })] })] })), activeTab === 'percentage' && (_jsxs(Card, { className: "p-4", children: [_jsx("h3", { className: "text-lg font-medium mb-4", children: "Percentage Rollout" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm mb-1", children: "Percentage (0-100)" }), _jsx(Input, { type: "number", min: "0", max: "100", value: ((_b = conditions.percentage) === null || _b === void 0 ? void 0 : _b.value) || 0, onChange: function (e) {
                                            updateConditions('percentage', __assign(__assign({}, (conditions.percentage || {})), { value: Number(e.target.value) }));
                                        } })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Switch, { checked: ((_c = conditions.percentage) === null || _c === void 0 ? void 0 : _c.sticky) || false, onCheckedChange: function (checked) {
                                            updateConditions('percentage', __assign(__assign({}, (conditions.percentage || {})), { sticky: checked }));
                                        } }), _jsx("span", { children: "Sticky (consistent per user)" })] })] })] })), activeTab === 'dateRange' && (_jsxs(Card, { className: "p-4", children: [_jsx("h3", { className: "text-lg font-medium mb-4", children: "Date Range" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm mb-1", children: "Start Date" }), _jsx(DatePicker, { value: ((_d = conditions.dateRange) === null || _d === void 0 ? void 0 : _d.startDate) ? new Date(conditions.dateRange.startDate) : null, onChange: function (date) {
                                            updateConditions('dateRange', __assign(__assign({}, (conditions.dateRange || {})), { startDate: date }));
                                        } })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm mb-1", children: "End Date" }), _jsx(DatePicker, { value: ((_e = conditions.dateRange) === null || _e === void 0 ? void 0 : _e.endDate) ? new Date(conditions.dateRange.endDate) : null, onChange: function (date) {
                                            updateConditions('dateRange', __assign(__assign({}, (conditions.dateRange || {})), { endDate: date }));
                                        } })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm mb-1", children: "Timezone" }), _jsx(Select, { value: ((_f = conditions.dateRange) === null || _f === void 0 ? void 0 : _f.timezone) || 'UTC', onChange: function (value) {
                                            updateConditions('dateRange', __assign(__assign({}, (conditions.dateRange || {})), { timezone: value }));
                                        }, options: [
                                            { label: 'UTC', value: 'UTC' },
                                            { label: 'Local', value: 'local' },
                                            // Add more timezone options as needed
                                        ] })] })] })] })), activeTab === 'deviceTypes' && (_jsxs(Card, { className: "p-4", children: [_jsx("h3", { className: "text-lg font-medium mb-4", children: "Device Type Targeting" }), _jsx("div", { className: "space-y-2", children: ['desktop', 'mobile', 'tablet'].map(function (device) { return (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Switch, { checked: (conditions.deviceTypes || []).includes(device), onCheckedChange: function (checked) {
                                        var deviceTypes = new Set(conditions.deviceTypes || []);
                                        if (checked) {
                                            deviceTypes.add(device);
                                        }
                                        else {
                                            deviceTypes.delete(device);
                                        }
                                        updateConditions('deviceTypes', Array.from(deviceTypes));
                                    } }), _jsx("span", { className: "capitalize", children: device })] }, device)); }) })] })), activeTab === 'customRules' && (_jsxs(Card, { className: "p-4", children: [_jsx("h3", { className: "text-lg font-medium mb-4", children: "Custom Rules" }), _jsxs("div", { className: "space-y-4", children: [(conditions.customRules || []).map(function (rule, index) { return (_jsxs("div", { className: "space-y-2", children: [_jsx(Input, { placeholder: "Rule Name", value: rule.name, onChange: function (e) {
                                            var customRules = __spreadArray([], (conditions.customRules || []), true);
                                            customRules[index] = __assign(__assign({}, rule), { name: e.target.value });
                                            updateConditions('customRules', customRules);
                                        } }), _jsx("textarea", { className: "w-full h-[200px] border rounded p-2 font-mono text-sm", value: rule.condition, onChange: function (e) {
                                            var customRules = __spreadArray([], (conditions.customRules || []), true);
                                            customRules[index] = __assign(__assign({}, rule), { condition: e.target.value });
                                            updateConditions('customRules', customRules);
                                        } }), _jsx(Button, { variant: "destructive", onClick: function () {
                                            var customRules = __spreadArray([], (conditions.customRules || []), true);
                                            customRules.splice(index, 1);
                                            updateConditions('customRules', customRules);
                                        }, children: "Remove Rule" })] }, index)); }), _jsx(Button, { onClick: function () {
                                    var customRules = __spreadArray([], (conditions.customRules || []), true);
                                    customRules.push({
                                        name: '',
                                        condition: '// Return true to enable the feature\nreturn true;'
                                    });
                                    updateConditions('customRules', customRules);
                                }, children: "Add Custom Rule" })] })] }))] }));
}
