"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s)
                if (Object.prototype.hasOwnProperty.call(s, p))
                    t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThemeCustomizer = void 0;
var react_1 = require("react");
var ThemeContext_1 = require("../ThemeContext");
var Button_1 = require("../../../core/components/ui/Button");
var colorOptions = [
    { name: 'Blue', value: '#2563eb' },
    { name: 'Indigo', value: '#4f46e5' },
    { name: 'Purple', value: '#7c3aed' },
    { name: 'Pink', value: '#db2777' },
    { name: 'Red', value: '#dc2626' },
    { name: 'Orange', value: '#ea580c' },
    { name: 'Green', value: '#16a34a' },
    { name: 'Teal', value: '#0d9488' },
];
var ThemeCustomizer = function () {
    var _a = (0, ThemeContext_1.useTheme)(), theme = _a.theme, setTheme = _a.setTheme, toggleColorMode = _a.toggleColorMode;
    var handleColorModeChange = function (mode) {
        setTheme({ mode: mode });
    };
    var handleFontSizeChange = function (fontSize) {
        setTheme({ fontSize: fontSize });
    };
    var handleSpacingChange = function (spacing) {
        setTheme({ spacing: spacing });
    };
    var handlePrimaryColorChange = function (color) {
        setTheme({
            colors: {
                light: __assign(__assign({}, theme.colors.light), { primary: color }),
                dark: __assign(__assign({}, theme.colors.dark), { primary: color }),
            },
        });
    };
    return className = "space-y-6 p-6 bg-white rounded-lg shadow" >
        { /* Color Mode */}
        < div >
        className;
    "text-lg font-medium text-gray-900 mb-4" > Color;
    Mode < /h3>
        < div;
    className = "flex space-x-4" >
        { ['light', 'dark', 'system']: .map(function (mode) {
                return key = { mode };
                onClick = { function() { return handleColorModeChange(mode); } };
                className = { "px-4 py-2 rounded-md text-sm font-medium ": .concat(theme.mode === mode
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100') } >
                    { mode, : .charAt(0).toUpperCase() + mode.slice(1) }
                    < /button>;
            }) };
}
    < /div>
    < /div>;
{ /* Primary Color */ }
className;
"text-lg font-medium text-gray-900 mb-4" >
    Primary;
Color
    < /h3>
    < div;
className = "grid grid-cols-8 gap-3" >
    { colorOptions, : .map(function (color) {
            return key = { color, : .value };
            onClick = { function() { return handlePrimaryColorChange(color.value); } };
            className = { "w-8 h-8 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 ": .concat(theme.colors.light.primary === color.value
                    ? 'ring-2 ring-offset-2 ring-blue-500'
                    : '') };
            style = {};
            {
                backgroundColor: color.value;
            }
        }, title = { color, : .name } /  > ) };
/div>
    < /div>;
{ /* Font Size */ }
className;
"text-lg font-medium text-gray-900 mb-4" > Font;
Size < /h3>
    < div;
className = "flex space-x-4" >
    { ['sm', 'md', 'lg']: .map(function (size) {
            return key = { size };
            onClick = { function() { return handleFontSizeChange(size); } };
            className = { "px-4 py-2 rounded-md text-sm font-medium ": .concat(theme.fontSize === size
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100') } >
                { size, : .toUpperCase() }
                < /button>;
        }) };
/div>
    < /div>;
{ /* Spacing */ }
className;
"text-lg font-medium text-gray-900 mb-4" > Spacing < /h3>
    < div;
className = "flex space-x-4" >
    { ['compact', 'comfortable', 'spacious']: .map(function (spacing) {
            return key = { spacing };
            onClick = { function() { return handleSpacingChange(spacing); } };
            className = { "px-4 py-2 rounded-md text-sm font-medium ": .concat(theme.spacing === spacing
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100') } >
                { spacing, : .charAt(0).toUpperCase() + spacing.slice(1) }
                < /button>;
        }) };
/div>
    < /div>;
{ /* Quick Actions */ }
className;
"border-t pt-6" >
    className;
"flex justify-between" >
    variant;
"outline";
onClick = { toggleColorMode } >
    Toggle;
Dark;
Mode
    < /Button_1.Button>
    < Button_1.Button;
variant = "outline";
onClick = { function() { return setTheme(__assign(__assign({}, theme), { mode: 'system' })); } } >
    Reset;
to;
System
    < /Button_1.Button>
    < /div>
    < /div>
    < /div>;
;
;
exports.ThemeCustomizer = ThemeCustomizer;
//# sourceMappingURL=ThemeCustomizer.js.map