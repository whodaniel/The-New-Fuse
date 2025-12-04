import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
var BuildInfoPage = function () {
    var buildInfo = {
        buildTool: 'Vite',
        framework: 'React 18.2.0',
        typescript: '✅ Enabled',
        hmr: '✅ Active',
        devMode: '✅ Active',
        navigationSystem: '✅ Comprehensive',
        pagesAvailable: '95+',
        productionReady: '✅ Yes',
        buildTime: new Date().toLocaleString(),
    };
    return (_jsxs("div", { className: "container mx-auto px-4 py-8", children: [_jsx("h1", { className: "text-3xl font-bold mb-6", children: "\uD83D\uDCCB Build Information" }), _jsxs("div", { className: "bg-white shadow rounded-lg p-6", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Environment Details" }), _jsx("ul", { className: "space-y-2", children: Object.entries(buildInfo).map(function (_a) {
                            var key = _a[0], value = _a[1];
                            return (_jsxs("li", { children: [_jsxs("strong", { children: [key.replace(/([A-Z])/g, ' $1').replace(/^./, function (str) { return str.toUpperCase(); }), ":"] }), " ", value] }, key));
                        }) })] })] }));
};
export default BuildInfoPage;
