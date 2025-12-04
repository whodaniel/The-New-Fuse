import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Select, ColorPicker, Switch, VStack } from '@chakra-ui/react';
import { useTheme } from './ThemeContext';
export var ThemeCustomizer = function () {
    var _a = useTheme(), currentTheme = _a.currentTheme, setTheme = _a.setTheme, customizeTheme = _a.customizeTheme;
    var handleColorChange = function (color, type) {
        var _a;
        customizeTheme({
            colors: (_a = {},
                _a[type] = color,
                _a)
        });
    };
    var handleFontChange = function (fontFamily) {
        customizeTheme({
            fonts: {
                body: fontFamily
            }
        });
    };
    return (_jsxs(VStack, { spacing: 4, p: 4, children: [_jsxs(Select, { value: currentTheme, onChange: function (e) { return setTheme(e.target.value); }, children: [_jsx("option", { value: "base", children: "Light Theme" }), _jsx("option", { value: "dark", children: "Dark Theme" }), _jsx("option", { value: "custom", children: "Custom Theme" })] }), _jsx(ColorPicker, { label: "Primary Color", onChange: function (color) { return handleColorChange(color, 'primary'); } }), _jsx(ColorPicker, { label: "Secondary Color", onChange: function (color) { return handleColorChange(color, 'secondary'); } }), _jsxs(Select, { placeholder: "Select Font Family", onChange: function (e) { return handleFontChange(e.target.value); }, children: [_jsx("option", { value: "Inter", children: "Inter" }), _jsx("option", { value: "Roboto", children: "Roboto" }), _jsx("option", { value: "Open Sans", children: "Open Sans" })] }), _jsx(Switch, { label: "High Contrast", onChange: function (e) { return customizeTheme({ contrast: e.target.checked }); } })] }));
};
