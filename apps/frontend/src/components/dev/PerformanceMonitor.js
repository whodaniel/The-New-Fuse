import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
export var PerformanceMonitor = function () {
    var _a = useState(0), fps = _a[0], setFps = _a[1];
    var _b = useState(0), memory = _b[0], setMemory = _b[1];
    useEffect(function () {
        var frameCount = 0;
        var lastTime = performance.now();
        var updateMetrics = function () {
            var now = performance.now();
            frameCount++;
            if (now - lastTime > 1000) {
                setFps(Math.round(frameCount * 1000 / (now - lastTime)));
                frameCount = 0;
                lastTime = now;
                // Update memory usage if available
                if (performance === null || performance === void 0 ? void 0 : performance.memory) {
                    setMemory(Math.round(performance.memory.usedJSHeapSize / 1048576));
                }
            }
            requestAnimationFrame(updateMetrics);
        };
        requestAnimationFrame(updateMetrics);
        return function () {
            frameCount = 0;
        };
    }, []);
    return (_jsxs("div", { className: "performance-monitor space-y-1 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "FPS:" }), _jsx("span", { className: fps < 30 ? 'text-red-500' : 'text-green-500', children: fps })] }), memory > 0 && (_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Memory:" }), _jsxs("span", { children: [memory, " MB"] })] }))] }));
};
