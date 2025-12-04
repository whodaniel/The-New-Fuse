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
export var CollectionEditor = function (_b) {
    var items = _b.items, schema = _b.schema, onChange = _b.onChange;
    var _c = useState(items), entries = _c[0], setEntries = _c[1];
    useEffect(function () {
        setEntries(items);
    }, [items]);
    var addEntry = function () {
        var newEntry = schema.properties.reduce(function (acc, prop) {
            acc[prop.name] = prop.default || '';
            return acc;
        }, {});
        var newEntries = __spreadArray(__spreadArray([], entries, true), [newEntry], false);
        setEntries(newEntries);
        onChange(newEntries);
    };
    var updateEntry = function (index, field, value) {
        var _b;
        var newEntries = __spreadArray([], entries, true);
        newEntries[index] = Object.assign(Object.assign({}, newEntries[index]), (_b = {}, _b[field] = value, _b));
        setEntries(newEntries);
        onChange(newEntries);
    };
    var removeEntry = function (index) {
        var newEntries = entries.filter(function (_, i) { return i !== index; });
        setEntries(newEntries);
        onChange(newEntries);
    };
    var renderField = function (prop, value, onFieldChange) {
        var _a;
        switch (prop.type) {
            case 'string':
                return (_jsx("input", { type: "text", value: value || '', onChange: function (e) { return onFieldChange(e.target.value); }, placeholder: prop.displayName, className: "collection-input" }));
            case 'number':
                return (_jsx("input", { type: "number", value: value || '', onChange: function (e) { return onFieldChange(Number(e.target.value)); }, placeholder: prop.displayName, className: "collection-input" }));
            case 'boolean':
                return (_jsx("input", { type: "checkbox", checked: value || false, onChange: function (e) { return onFieldChange(e.target.checked); }, className: "collection-checkbox" }));
            case 'options':
                return (_jsxs("select", { value: value || '', onChange: function (e) { return onFieldChange(e.target.value); }, className: "collection-select", children: [_jsxs("option", { value: "", children: ["Select ", prop.displayName] }), (_a = prop.options) === null || _a === void 0 ? void 0 : _a.map(function (opt) { return (_jsx("option", { value: opt.value, children: opt.name }, opt.value)); })] }));
            default:
                return (_jsx("input", { type: "text", value: value || '', onChange: function (e) { return onFieldChange(e.target.value); }, placeholder: prop.displayName, className: "collection-input" }));
        }
    };
    return (_jsxs("div", { className: "collection-editor", children: [entries.map(function (entry, index) { return (_jsxs("div", { className: "collection-item", children: [_jsxs("div", { className: "collection-item-header", children: [_jsxs("span", { children: ["Item ", index + 1] }), _jsx("button", { onClick: function () { return removeEntry(index); }, className: "remove-button", type: "button", children: "\u2715" })] }), _jsx("div", { className: "collection-item-fields", children: schema.properties.map(function (prop) { return (_jsxs("div", { className: "collection-field", children: [_jsxs("label", { children: [prop.displayName, prop.required && _jsx("span", { className: "required", children: "*" })] }), renderField(prop, entry[prop.name], function (value) { return updateEntry(index, prop.name, value); })] }, prop.name)); }) })] }, index)); }), _jsx("button", { onClick: addEntry, className: "add-button", type: "button", children: "Add Item" })] }));
};
