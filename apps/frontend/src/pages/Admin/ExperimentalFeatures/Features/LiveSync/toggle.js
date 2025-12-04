import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Switch } from '../../../../../components/ui/switch';
var LiveSyncToggle = function (_a) {
    var enabled = _a.enabled, onChange = _a.onChange;
    return (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Switch, { checked: enabled, onCheckedChange: onChange, id: "live-sync-toggle" }), _jsx("label", { htmlFor: "live-sync-toggle", className: "text-sm font-medium", children: "Enable live document synchronization" })] }));
};
export default LiveSyncToggle;
