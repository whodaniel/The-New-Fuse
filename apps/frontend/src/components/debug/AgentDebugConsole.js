import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Console } from '@/components/ui/console';
import { Timeline } from '@/components/ui/timeline';
export var AgentDebugConsole = function () {
    var _a = useState(null), selectedAgent = _a[0], setSelectedAgent = _a[1];
    var _b = useState('1h'), timeRange = _b[0], setTimeRange = _b[1];
    return (_jsxs("div", { className: "h-full flex flex-col", children: [_jsxs("div", { className: "flex justify-between p-4", children: [_jsx(AgentSelector, { value: selectedAgent, onChange: setSelectedAgent }), _jsx(TimeRangeSelector, { value: timeRange, onChange: setTimeRange })] }), _jsxs("div", { className: "flex-1 grid grid-cols-2", children: [_jsx(Console, { agentId: selectedAgent, filters: {
                            level: ['error', 'warn', 'info', 'debug'],
                            timeRange: timeRange
                        }, onCommand: function (cmd) { } }), _jsx(Timeline, { agentId: selectedAgent, timeRange: timeRange, events: [
                            'decisions',
                            'actions',
                            'state_changes',
                            'errors'
                        ] })] })] }));
};
