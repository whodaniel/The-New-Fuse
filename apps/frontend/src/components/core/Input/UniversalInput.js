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
// UniversalInput.tsx
import { forwardRef } from "react";
/**
 * UniversalInput
 * A custom, extensible input component for consistent user/AI/web/extension/relay/terminal input/output.
 * Designed for easy integration with web forms, browser extensions, and backend services.
 */
export var UniversalInput = forwardRef(function (_a, ref) {
    var value = _a.value, onChange = _a.onChange, _b = _a.source, source = _b === void 0 ? "user" : _b, _c = _a.destination, destination = _c === void 0 ? "ai" : _c, _d = _a.type, type = _d === void 0 ? "text" : _d, _e = _a.placeholder, placeholder = _e === void 0 ? "" : _e, _f = _a.disabled, disabled = _f === void 0 ? false : _f, _g = _a.autoFocus, autoFocus = _g === void 0 ? false : _g, _h = _a.className, className = _h === void 0 ? "" : _h, _j = _a.style, style = _j === void 0 ? {} : _j, rest = __rest(_a, ["value", "onChange", "source", "destination", "type", "placeholder", "disabled", "autoFocus", "className", "style"]);
    // Handler to provide meta info on change
    var handleChange = function (e) {
        onChange(e.target.value, { source: source, destination: destination });
    };
    return (_jsx("input", __assign({ ref: ref, type: type, value: value, onChange: handleChange, placeholder: placeholder, disabled: disabled, autoFocus: autoFocus, className: className, style: style, "data-input-source": source, "data-input-destination": destination }, rest)));
});
UniversalInput.displayName = "UniversalInput";
