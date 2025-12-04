import { jsx as _jsx } from "react/jsx-runtime";
import { create } from 'react-test-renderer';
import { ThemeProvider } from '@/shared/providers/theme/ThemeProvider';
var SnapshotWrapper = function (_a) {
    var _b = _a.theme, theme = _b === void 0 ? 'light' : _b, children = _a.children;
    return (_jsx(ThemeProvider, { defaultTheme: theme, storageKey: "test-theme", children: children }));
};
export var createSnapshot = function (ui, options) {
    if (options === void 0) { options = {}; }
    var _a = options.theme, theme = _a === void 0 ? 'light' : _a;
    return create(_jsx(SnapshotWrapper, { theme: theme, children: ui }));
};
export var updateSnapshot = function (renderer) {
    expect(renderer.toJSON()).toMatchSnapshot();
};
export var assertSnapshot = function (ui, options) {
    var renderer = createSnapshot(ui, options);
    updateSnapshot(renderer);
    return renderer;
};
