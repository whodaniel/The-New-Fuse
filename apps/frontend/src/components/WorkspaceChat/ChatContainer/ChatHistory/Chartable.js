import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function Chartable(_a) {
    var workspace = _a.workspace, props = _a.props;
    // Basic chart visualization component
    return (_jsx("div", { className: "flex justify-center items-center w-full my-4", children: _jsxs("div", { className: "bg-white/10 rounded-lg p-4 w-full max-w-4xl", children: [_jsx("h3", { className: "text-white text-lg font-semibold mb-2", children: "Chart Visualization" }), _jsx("div", { className: "bg-white/5 rounded p-4 min-h-[200px] flex items-center justify-center", children: _jsxs("div", { className: "text-white/60 text-center", children: [_jsx("div", { className: "text-2xl mb-2", children: "\uD83D\uDCCA" }), _jsx("p", { children: "Chart data would be rendered here" }), _jsx("pre", { className: "text-xs mt-2 text-left overflow-auto max-h-20", children: JSON.stringify(props.content, null, 2) })] }) })] }) }));
}
