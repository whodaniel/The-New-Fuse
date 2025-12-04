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
exports.FormTextField = FormTextField;
exports.FormSelectField = FormSelectField;
exports.FormCheckboxField = FormCheckboxField;
exports.FormSwitchField = FormSwitchField;
exports.FormSliderField = FormSliderField;
exports.FormAutocompleteField = FormAutocompleteField;
exports.FormArrayField = FormArrayField;
import react_1 from 'react';
function FormTextField(_a) {
    var name = _a.name, label = _a.label, value = _a.value, _b = _a.type, type = _b === void 0 ? 'text' : _b, required = _a.required, disabled = _a.disabled, error = _a.error, helperText = _a.helperText, multiline = _a.multiline, rows = _a.rows, placeholder = _a.placeholder, autoComplete = _a.autoComplete, onChange = _a.onChange, sx = _a.sx;
    var _c = react_1.default.useState(false), showPassword = _c[0], setShowPassword = _c[1];
    return (_jsx(material_1.TextField, { fullWidth: true, name: name, label: label, value: value, type: type === 'password' && showPassword ? 'text' : type, required: required, disabled: disabled, error: error, helperText: helperText, multiline: multiline, rows: rows, placeholder: placeholder, autoComplete: autoComplete, onChange: function (e) { return onChange(e.target.value); }, sx: sx, InputProps: type === 'password' ? {
            endAdornment: (_jsx(material_1.InputAdornment, { position: "end", children: _jsx(material_1.IconButton, { onClick: function () { return setShowPassword(!showPassword); }, edge: "end", children: showPassword ? _jsx(icons_material_1.VisibilityOff, {}) : _jsx(icons_material_1.Visibility, {}) }) }))
        } : undefined }));
}
function FormSelectField(_a) {
    var name = _a.name, label = _a.label, value = _a.value, options = _a.options, multiple = _a.multiple, required = _a.required, disabled = _a.disabled, error = _a.error, helperText = _a.helperText, onChange = _a.onChange, sx = _a.sx;
    return (_jsxs(material_1.FormControl, { fullWidth: true, error: error, required: required, disabled: disabled, sx: sx, children: [_jsx(material_1.InputLabel, { children: label }), _jsx(material_1.Select, { name: name, value: value, multiple: multiple, onChange: function (e) { return onChange(e.target.value); }, label: label, children: options.map(function (option) { return (_jsx(material_1.MenuItem, { value: option.value, children: option.label }, option.value)); }) }), helperText && _jsx(material_1.FormHelperText, { children: helperText })] }));
}
function FormCheckboxField(_a) {
    var name = _a.name, label = _a.label, value = _a.value, required = _a.required, disabled = _a.disabled, error = _a.error, helperText = _a.helperText, onChange = _a.onChange, sx = _a.sx;
    return (_jsxs(material_1.FormControl, { error: error, required: required, disabled: disabled, sx: sx, children: [_jsx(material_1.FormControlLabel, { control: _jsx(material_1.Checkbox, { name: name, checked: value, onChange: function (e) { return onChange(e.target.checked); } }), label: label }), helperText && _jsx(material_1.FormHelperText, { children: helperText })] }));
}
function FormSwitchField(_a) {
    var name = _a.name, label = _a.label, value = _a.value, required = _a.required, disabled = _a.disabled, error = _a.error, helperText = _a.helperText, onChange = _a.onChange, sx = _a.sx;
    return (_jsxs(material_1.FormControl, { error: error, required: required, disabled: disabled, sx: sx, children: [_jsx(material_1.FormControlLabel, { control: _jsx(material_1.Switch, { name: name, checked: value, onChange: function (e) { return onChange(e.target.checked); } }), label: label }), helperText && _jsx(material_1.FormHelperText, { children: helperText })] }));
}
function FormSliderField(_a) {
    var name = _a.name, label = _a.label, value = _a.value, _b = _a.min, min = _b === void 0 ? 0 : _b, _c = _a.max, max = _c === void 0 ? 100 : _c, _d = _a.step, step = _d === void 0 ? 1 : _d, marks = _a.marks, _e = _a.valueLabelDisplay, valueLabelDisplay = _e === void 0 ? 'auto' : _e, required = _a.required, disabled = _a.disabled, error = _a.error, helperText = _a.helperText, onChange = _a.onChange, sx = _a.sx;
    return (_jsxs(material_1.FormControl, { fullWidth: true, error: error, required: required, disabled: disabled, sx: sx, children: [_jsx(material_1.Typography, { gutterBottom: true, children: label }), _jsx(material_1.Slider, { name: name, value: value, min: min, max: max, step: step, marks: marks, valueLabelDisplay: valueLabelDisplay, onChange: function (_, value) { return onChange(value); } }), helperText && _jsx(material_1.FormHelperText, { children: helperText })] }));
}
function FormAutocompleteField(_a) {
    var name = _a.name, label = _a.label, value = _a.value, options = _a.options, multiple = _a.multiple, freeSolo = _a.freeSolo, placeholder = _a.placeholder, required = _a.required, disabled = _a.disabled, error = _a.error, helperText = _a.helperText, onChange = _a.onChange, sx = _a.sx;
    return (_jsx(material_1.FormControl, { fullWidth: true, error: error, required: required, disabled: disabled, sx: sx, children: _jsx(material_1.Autocomplete, { multiple: multiple, freeSolo: freeSolo, options: options, value: value, onChange: function (_, value) { return onChange(value); }, renderInput: function (params) { return (_jsx(material_1.TextField, __assign({}, params, { name: name, label: label, placeholder: placeholder, error: error, helperText: helperText }))); }, renderTags: function (value, getTagProps) { return value.map(function (option, index) { return (_jsx(material_1.Chip, __assign({ variant: "outlined", label: option }, getTagProps({ index: index })))); }); } }) }));
}
function FormArrayField(_a) {
    var name = _a.name, label = _a.label, value = _a.value, renderField = _a.renderField, _b = _a.addLabel, addLabel = _b === void 0 ? 'Add Item' : _b, _c = _a.removeLabel, removeLabel = _c === void 0 ? 'Remove' : _c, required = _a.required, disabled = _a.disabled, error = _a.error, helperText = _a.helperText, onChange = _a.onChange, sx = _a.sx;
    var handleAdd = function () {
        onChange(__spreadArray(__spreadArray([], value, true), [null], false));
    };
    var handleRemove = function (index) {
        onChange(value.filter(function (_, i) { return i !== index; }));
    };
    var handleChange = function (index, newValue) {
        onChange(value.map(function (v, i) { return i === index ? newValue : v; }));
    };
    return (_jsxs(material_1.FormControl, { fullWidth: true, error: error, required: required, disabled: disabled, sx: sx, children: [_jsx(material_1.Typography, { gutterBottom: true, children: label }), _jsxs(material_1.Stack, { columns: 2, children: [value.map(function (item, index) { return (_jsxs(material_1.Box, { display: "flex", alignItems: "center", gap: 1, children: [renderField(item, index), _jsx(material_1.IconButton, { onClick: function () { return handleRemove(index); }, color: "error", title: removeLabel, children: _jsx(icons_material_1.Remove, {}) })] }, index)); }), _jsx(material_1.Button, { startIcon: _jsx(icons_material_1.Add, {}), onClick: handleAdd, variant: "outlined", sx: { alignSelf: 'flex-start' }, children: addLabel })] }), helperText && _jsx(material_1.FormHelperText, { children: helperText })] }));
}
