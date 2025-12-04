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
import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, useContext } from 'react';
var FormFieldContext = createContext({});
var FormItemContext = createContext({});
var useFormField = function () {
    var fieldContext = useContext(FormFieldContext);
    var itemContext = useContext(FormItemContext);
    if (!fieldContext) {
        throw new Error('useFormField should be used within <FormField>');
    }
    var id = itemContext.id;
    return {
        id: id,
        name: fieldContext.name,
        formItemId: "".concat(id, "-form-item"),
        formDescriptionId: "".concat(id, "-form-item-description"),
        formMessageId: "".concat(id, "-form-item-message"),
    };
};
var Form = function (_a) {
    var form = _a.form, children = _a.children, onSubmit = _a.onSubmit, props = __rest(_a, ["form", "children", "onSubmit"]);
    return (_jsx("form", __assign({ onSubmit: onSubmit ? form.handleSubmit(onSubmit) : undefined }, props, { children: children })));
};
var FormField = function (_a) {
    var control = _a.control, name = _a.name, render = _a.render;
    return (_jsx(FormFieldContext.Provider, { value: { name: name }, children: render({ field: { name: name, value: '', onChange: function () { } } }) }));
};
var FormItem = React.forwardRef(function (_a, ref) {
    var _b = _a.className, className = _b === void 0 ? '' : _b, props = __rest(_a, ["className"]);
    var id = React.useId();
    return (_jsx(FormItemContext.Provider, { value: { id: id }, children: _jsx("div", __assign({ ref: ref, className: "space-y-2 ".concat(className) }, props)) }));
});
var FormLabel = React.forwardRef(function (_a, ref) {
    var _b = _a.className, className = _b === void 0 ? '' : _b, props = __rest(_a, ["className"]);
    var formItemId = useFormField().formItemId;
    return (_jsx("label", __assign({ ref: ref, className: "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ".concat(className), htmlFor: formItemId }, props)));
});
var FormControl = React.forwardRef(function (_a, ref) {
    var props = __rest(_a, []);
    var _b = useFormField(), formItemId = _b.formItemId, formDescriptionId = _b.formDescriptionId, formMessageId = _b.formMessageId;
    return (_jsx("div", __assign({ ref: ref, id: formItemId, "aria-describedby": "".concat(formDescriptionId, " ").concat(formMessageId) }, props)));
});
var FormDescription = React.forwardRef(function (_a, ref) {
    var _b = _a.className, className = _b === void 0 ? '' : _b, props = __rest(_a, ["className"]);
    var formDescriptionId = useFormField().formDescriptionId;
    return (_jsx("p", __assign({ ref: ref, id: formDescriptionId, className: "text-sm text-muted-foreground ".concat(className) }, props)));
});
var FormMessage = React.forwardRef(function (_a, ref) {
    var _b = _a.className, className = _b === void 0 ? '' : _b, children = _a.children, props = __rest(_a, ["className", "children"]);
    var formMessageId = useFormField().formMessageId;
    return (_jsx("p", __assign({ ref: ref, id: formMessageId, className: "text-sm font-medium text-destructive ".concat(className) }, props, { children: children })));
});
FormItem.displayName = 'FormItem';
FormLabel.displayName = 'FormLabel';
FormControl.displayName = 'FormControl';
FormDescription.displayName = 'FormDescription';
FormMessage.displayName = 'FormMessage';
export { useFormField, Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage, FormField, };
