"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentMetrics = void 0;
var react_1 = require("react");
var Card_1 = require("../ui/Card");
var AgentMetrics = function (_a) {
    var metrics = _a.metrics, _b = _a.className, className = _b === void 0 ? '' : _b;
    var formatNumber = function (num) {
        return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
    };
    var formatPercentage = function (num) {
        return "".concat((num * 100).toFixed(1), "%");
    };
    var formatTime = function (ms) {
        if (ms < 1000)
            return "".concat(ms, "ms");
        var seconds = ms / 1000;
        if (seconds < 60)
            return "".concat(seconds.toFixed(1), "s");
        var minutes = seconds / 60;
        return "".concat(minutes.toFixed(1), "m");
    };
    return (<Card_1.Card className={className}>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-500">Tasks Completed</h4>
          <p className="text-2xl font-semibold text-gray-900">
            {formatNumber(metrics.tasksCompleted)}
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-500">Average Response Time</h4>
          <p className="text-2xl font-semibold text-gray-900">
            {formatTime(metrics.averageResponseTime)}
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-500">Success Rate</h4>
          <div className="flex items-center">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: "".concat(metrics.successRate * 100, "%") }}/>
            </div>
            <span className="ml-2 text-sm font-medium text-gray-700">
              {formatPercentage(metrics.successRate)}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-500">Error Rate</h4>
          <div className="flex items-center">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full" style={{ width: "".concat(metrics.errorRate * 100, "%") }}/>
            </div>
            <span className="ml-2 text-sm font-medium text-gray-700">
              {formatPercentage(metrics.errorRate)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-500">Uptime</h4>
        <div className="mt-2 flex items-center">
          <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: "".concat((metrics.uptime / 100) * 100, "%") }}/>
          </div>
          <span className="ml-2 text-sm font-medium text-gray-700">
            {formatPercentage(metrics.uptime / 100)}
          </span>
        </div>
      </div>
    </Card_1.Card>);
};
exports.AgentMetrics = AgentMetrics;
export {};
