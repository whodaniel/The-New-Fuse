import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
var SimpleLanding = function () {
    return (_jsxs("div", { style: {
            padding: '40px',
            backgroundColor: '#1a202c',
            color: 'white',
            minHeight: '100vh',
            fontFamily: 'Arial, sans-serif'
        }, children: [_jsxs("header", { style: {
                    padding: '20px',
                    backgroundColor: '#2d3748',
                    marginBottom: '40px',
                    borderRadius: '8px'
                }, children: [_jsx("h1", { children: "\uD83D\uDD27 SIMPLIFIED LANDING - DEBUGGING MODE" }), _jsxs("nav", { children: [_jsx("a", { href: "/home", style: { color: 'cyan', marginRight: '20px' }, children: "Home" }), _jsx("a", { href: "/auth/login", style: { color: 'cyan', marginRight: '20px' }, children: "Login" }), _jsx("a", { href: "/debug-routing", style: { color: 'cyan', marginRight: '20px' }, children: "Debug" })] })] }), _jsxs("main", { children: [_jsx("h2", { children: "\uD83D\uDE80 The New Fuse - Simplified Version" }), _jsx("p", { children: "If you can see this header and navigation, then:" }), _jsxs("ul", { children: [_jsx("li", { children: "\u2705 React is rendering correctly" }), _jsx("li", { children: "\u2705 The Landing component is working" }), _jsx("li", { children: "\u2753 The complex version has issues" })] }), _jsxs("div", { style: { marginTop: '40px' }, children: [_jsx("h3", { children: "Quick Tests:" }), _jsx("button", { onClick: function () {
                                    alert('React click events work!');
                                    console.log('Button clicked at:', new Date());
                                }, style: {
                                    padding: '10px 20px',
                                    backgroundColor: '#4299e1',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    marginRight: '10px'
                                }, children: "Test React Click" }), _jsx("button", { onClick: function () {
                                    window.location.href = '/debug-routing';
                                }, style: {
                                    padding: '10px 20px',
                                    backgroundColor: '#48bb78',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }, children: "Navigate to Debug Route" })] }), _jsxs("div", { style: { marginTop: '40px', backgroundColor: '#2d3748', padding: '20px', borderRadius: '8px' }, children: [_jsx("h4", { children: "Current Page Info:" }), _jsxs("p", { children: ["URL: ", typeof window !== 'undefined' ? window.location.href : 'SSR'] }), _jsxs("p", { children: ["Pathname: ", typeof window !== 'undefined' ? window.location.pathname : 'SSR'] }), _jsxs("p", { children: ["Timestamp: ", new Date().toISOString()] })] })] }), _jsx("footer", { style: {
                    marginTop: '60px',
                    padding: '20px',
                    backgroundColor: '#2d3748',
                    borderRadius: '8px'
                }, children: _jsx("p", { children: "\uD83D\uDD27 Debug Footer - If you see this, footer rendering works!" }) })] }));
};
export default SimpleLanding;
