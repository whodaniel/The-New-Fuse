import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
var DebugRouting = function () {
    return (_jsxs("div", { style: {
            padding: '20px',
            backgroundColor: 'yellow',
            color: 'black',
            fontSize: '24px',
            textAlign: 'center'
        }, children: [_jsx("h1", { children: "\uD83D\uDD27 DEBUG ROUTING TEST" }), _jsx("p", { children: "If you can see this, React Router is working!" }), _jsxs("p", { children: ["Current URL: ", window.location.href] }), _jsxs("p", { children: ["Current pathname: ", window.location.pathname] }), _jsx("button", { onClick: function () { return console.log('React is working!'); }, children: "Test React Click" })] }));
};
export default DebugRouting;
