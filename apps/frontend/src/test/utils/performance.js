import { performance } from 'perf_hooks';
import { logger } from './logger';
var PerformanceMonitor = /** @class */ (function () {
    function PerformanceMonitor() {
    }
    PerformanceMonitor.startMeasure = function (name) {
        performance.mark("".concat(name, "-start"));
    };
    PerformanceMonitor.endMeasure = function (name) {
        var _a;
        performance.mark("".concat(name, "-end"));
        performance.measure(name, "".concat(name, "-start"), "".concat(name, "-end"));
        var measure = performance.getEntriesByName(name).pop();
        if (measure) {
            if (!this.metrics.has(name)) {
                this.metrics.set(name, []);
            }
            (_a = this.metrics.get(name)) === null || _a === void 0 ? void 0 : _a.push(measure.duration);
        }
    };
    PerformanceMonitor.generateReport = function () {
        for (var _i = 0, _a = this.metrics.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], name_1 = _b[0], durations = _b[1];
            var avg = durations.reduce(function (a, b) { return a + b; }, 0) / durations.length;
            var min = Math.min.apply(Math, durations);
            var max = Math.max.apply(Math, durations);
            logger.info("Performance Report - ".concat(name_1, ":"), {
                average: avg.toFixed(2),
                min: min.toFixed(2),
                max: max.toFixed(2),
                samples: durations.length
            });
        }
    };
    PerformanceMonitor.metrics = new Map();
    return PerformanceMonitor;
}());
export { PerformanceMonitor };
