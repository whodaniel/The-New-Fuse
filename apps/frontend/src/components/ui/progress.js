import { jsx as _jsx } from "react/jsx-runtime";
export var Progress = function (_a) {
    var _b = _a.value, value = _b === void 0 ? 0 : _b, _c = _a.max, max = _c === void 0 ? 100 : _c, _d = _a.className, className = _d === void 0 ? '' : _d, _e = _a.size, size = _e === void 0 ? 'md' : _e, _f = _a.color, color = _f === void 0 ? 'blue' : _f;
    var percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    var sizeClasses = {
        sm: 'h-2',
        md: 'h-3',
        lg: 'h-4',
    };
    var colorClasses = {
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        red: 'bg-red-500',
        yellow: 'bg-yellow-500',
        purple: 'bg-purple-500',
    };
    return (_jsx("div", { className: "w-full bg-gray-200 rounded-full overflow-hidden ".concat(sizeClasses[size], " ").concat(className), children: _jsx("div", { className: "".concat(colorClasses[color], " ").concat(sizeClasses[size], " rounded-full transition-all duration-300 ease-out"), style: { width: "".concat(percentage, "%") }, role: "progressbar", "aria-valuenow": value, "aria-valuemin": 0, "aria-valuemax": max }) }));
};
