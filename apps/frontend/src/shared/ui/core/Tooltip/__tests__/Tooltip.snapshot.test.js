import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { assertSnapshot } from '@/test/helpers/snapshot';
import { Tooltip } from '../Tooltip';
import { Button } from '../../Button';
describe('Tooltip Snapshots', function () {
    it('renders basic tooltip correctly', function () {
        assertSnapshot(_jsx(Tooltip, { content: "This is a tooltip", children: _jsx(Button, { children: "Hover me" }) }));
    });
    it('renders tooltip with custom side', function () {
        assertSnapshot(_jsxs(_Fragment, { children: [_jsx(Tooltip, { content: "Top tooltip", side: "top", children: _jsx(Button, { children: "Top" }) }), _jsx(Tooltip, { content: "Right tooltip", side: "right", children: _jsx(Button, { children: "Right" }) }), _jsx(Tooltip, { content: "Bottom tooltip", side: "bottom", children: _jsx(Button, { children: "Bottom" }) }), _jsx(Tooltip, { content: "Left tooltip", side: "left", children: _jsx(Button, { children: "Left" }) })] }));
    });
    it('renders tooltip with custom alignment', function () {
        assertSnapshot(_jsxs(_Fragment, { children: [_jsx(Tooltip, { content: "Start aligned", align: "start", children: _jsx(Button, { children: "Start" }) }), _jsx(Tooltip, { content: "Center aligned", align: "center", children: _jsx(Button, { children: "Center" }) }), _jsx(Tooltip, { content: "End aligned", align: "end", children: _jsx(Button, { children: "End" }) })] }));
    });
    it('renders tooltip with delay', function () {
        assertSnapshot(_jsx(Tooltip, { content: "Delayed tooltip", delayDuration: 500, children: _jsx(Button, { children: "Delayed" }) }));
    });
    it('renders tooltip with HTML content', function () {
        assertSnapshot(_jsx(Tooltip, { content: _jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "font-semibold", children: "Rich Content" }), _jsx("p", { className: "text-sm text-gray-500", children: "With multiple lines" }), _jsx("div", { className: "h-1 w-full bg-gray-200 rounded" }), _jsx("p", { className: "text-xs", children: "And custom formatting" })] }), children: _jsx(Button, { children: "Rich Tooltip" }) }));
    });
});
