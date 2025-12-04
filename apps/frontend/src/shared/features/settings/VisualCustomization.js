import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Card } from '@/shared/ui/core/Card';
import { Select } from '@/shared/ui/core/Select';
export function VisualCustomization(_a) {
    var onCustomizationChange = _a.onCustomizationChange;
    var _b = React.useState({
        bodyType: '',
        facialFeatures: '',
        clothing: '',
        accessories: '',
    }), customization = _b[0], setCustomization = _b[1];
    var handleChange = function (type, value) {
        setCustomization(function (prev) {
            var _a;
            return (Object.assign(Object.assign({}, prev), (_a = {}, _a[type] = value, _a)));
        });
        onCustomizationChange === null || onCustomizationChange === void 0 ? void 0 : onCustomizationChange(type, value);
    };
    return (_jsxs(Card, { className: "p-6", children: [_jsx("h2", { className: "text-xl font-bold mb-6", children: "Visual Customization" }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "font-medium", children: "Body Type" }), _jsxs(Select, { value: customization.bodyType, onValueChange: function (value) { return handleChange('bodyType', value); }, children: [_jsx(Select.Trigger, { className: "w-full", children: _jsx(Select.Value, { placeholder: "Select Body Type" }) }), _jsxs(Select.Content, { children: [_jsx(Select.Item, { value: "human", children: "Human" }), _jsx(Select.Item, { value: "elf", children: "Elf" }), _jsx(Select.Item, { value: "dwarf", children: "Dwarf" })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "font-medium", children: "Facial Features" }), _jsxs(Select, { value: customization.facialFeatures, onValueChange: function (value) { return handleChange('facialFeatures', value); }, children: [_jsx(Select.Trigger, { className: "w-full", children: _jsx(Select.Value, { placeholder: "Select Facial Features" }) }), _jsxs(Select.Content, { children: [_jsx(Select.Item, { value: "beard", children: "Beard" }), _jsx(Select.Item, { value: "glasses", children: "Glasses" }), _jsx(Select.Item, { value: "mustache", children: "Mustache" })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "font-medium", children: "Clothing" }), _jsxs(Select, { value: customization.clothing, onValueChange: function (value) { return handleChange('clothing', value); }, children: [_jsx(Select.Trigger, { className: "w-full", children: _jsx(Select.Value, { placeholder: "Select Clothing" }) }), _jsxs(Select.Content, { children: [_jsx(Select.Item, { value: "robe", children: "Robe" }), _jsx(Select.Item, { value: "armor", children: "Armor" }), _jsx(Select.Item, { value: "casual", children: "Casual" })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "font-medium", children: "Accessories" }), _jsxs(Select, { value: customization.accessories, onValueChange: function (value) { return handleChange('accessories', value); }, children: [_jsx(Select.Trigger, { className: "w-full", children: _jsx(Select.Value, { placeholder: "Select Accessories" }) }), _jsxs(Select.Content, { children: [_jsx(Select.Item, { value: "sword", children: "Sword" }), _jsx(Select.Item, { value: "staff", children: "Staff" }), _jsx(Select.Item, { value: "backpack", children: "Backpack" })] })] })] })] })] }));
}
