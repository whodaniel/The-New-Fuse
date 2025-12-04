import { jsx as _jsx } from "react/jsx-runtime";
export var ColorBox = function (_a) {
    var color = _a.color, onClick = _a.onClick;
    return (_jsx("div", { style: { backgroundColor: color }, className: "w-10 h-10 cursor-pointer border-2 border-white rounded hover:opacity-80", onClick: onClick }));
};
