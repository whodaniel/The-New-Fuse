import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { DataType, TIMELINE_DEFAULT_ITEM_DURATION_DAYS } from '@the-new-fuse/fairtable-core';
const DAY_WIDTH = 30; // px per day
const ROW_HEIGHT_TIMELINE = 36; // px per row in timeline
const HEADER_HEIGHT = 40; // px for date header
const LABEL_WIDTH = 150; // px for row labels
const formatDate = (date) => {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};
const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};
const getDaysDiff = (startDate, endDate) => {
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.round((endDate.getTime() - startDate.getTime()) / msPerDay);
};
const TimelineView = ({ table, view, rowsToDisplay, timelineOptions, }) => {
    const { startDateColumnId, endDateColumnId, labelColumnId } = timelineOptions;
    const startDateColumn = useMemo(() => table.columns.find((c) => c.id === startDateColumnId && c.type === DataType.DATE), [table.columns, startDateColumnId]);
    const endDateColumn = useMemo(() => table.columns.find((c) => c.id === endDateColumnId && c.type === DataType.DATE), [table.columns, endDateColumnId]);
    const labelColumn = useMemo(() => table.columns.find((c) => c.id === labelColumnId) || table.columns.find((c) => c.id === table.columnOrder[0]), [table.columns, labelColumnId, table.columnOrder]);
    const timelineItems = useMemo(() => {
        if (!startDateColumn)
            return [];
        return rowsToDisplay.map(row => {
            const rawStartDate = row.data[startDateColumn.id];
            let startDate = rawStartDate ? new Date(rawStartDate) : null;
            if (startDate && isNaN(startDate.getTime()))
                startDate = null;
            let endDate = null;
            if (endDateColumn) {
                const rawEndDate = row.data[endDateColumn.id];
                endDate = rawEndDate ? new Date(rawEndDate) : null;
                if (endDate && isNaN(endDate.getTime()))
                    endDate = null;
            }
            if (startDate && !endDate) {
                endDate = addDays(new Date(startDate), TIMELINE_DEFAULT_ITEM_DURATION_DAYS);
            }
            else if (startDate && endDate && endDate < startDate) {
                endDate = startDate; // Ensure end date is not before start date
            }
            const label = labelColumn ? String(row.data[labelColumn.id] ?? `Item ${row.id.slice(-4)}`) : `Item ${row.id.slice(-4)}`;
            return {
                id: row.id,
                label,
                startDate,
                endDate,
                originalRow: row,
            };
        }).filter(item => item.startDate && item.endDate); // Only items with valid start/end dates
    }, [rowsToDisplay, startDateColumn, endDateColumn, labelColumn, table.columns]);
    const { overallMinDate, overallMaxDate, totalDays } = useMemo(() => {
        if (timelineItems.length === 0) {
            const today = new Date();
            return { overallMinDate: today, overallMaxDate: addDays(today, 30), totalDays: 30 };
        }
        let minD = timelineItems[0].startDate;
        let maxD = timelineItems[0].endDate;
        timelineItems.forEach(item => {
            if (item.startDate < minD)
                minD = item.startDate;
            if (item.endDate > maxD)
                maxD = item.endDate;
        });
        // Add some padding
        const paddedMinDate = addDays(minD, -2);
        const paddedMaxDate = addDays(maxD, 5);
        return {
            overallMinDate: paddedMinDate,
            overallMaxDate: paddedMaxDate,
            totalDays: getDaysDiff(paddedMinDate, paddedMaxDate) + 1
        };
    }, [timelineItems]);
    const dateHeaders = useMemo(() => {
        const headers = [];
        for (let i = 0; i < totalDays; i++) {
            const date = addDays(overallMinDate, i);
            headers.push({ date, label: formatDate(date), dayIndex: i });
        }
        return headers;
    }, [overallMinDate, totalDays]);
    if (!startDateColumnId || !startDateColumn) {
        return _jsx("div", { className: "p-4 text-center text-red-500", children: "Timeline view requires a valid Start Date column (Date type) to be configured." });
    }
    if (endDateColumnId && !endDateColumn) {
        return _jsx("div", { className: "p-4 text-center text-red-500", children: "Timeline view has an End Date column configured, but it's not a valid Date type column." });
    }
    return (_jsx("div", { className: "flex-grow overflow-auto custom-scrollbar bg-white", children: _jsxs("div", { style: { width: LABEL_WIDTH + totalDays * DAY_WIDTH, position: 'relative' }, children: [_jsxs("div", { className: "sticky top-0 z-20 flex bg-slate-50 border-b border-slate-300", style: { height: HEADER_HEIGHT }, children: [_jsx("div", { className: "sticky left-0 z-10 w-[150px] border-r border-slate-300 bg-slate-100 flex items-center justify-center", children: _jsx("span", { className: "text-xs font-medium text-slate-600", children: "Items" }) }), dateHeaders.map(({ date, label, dayIndex }) => (_jsx("div", { className: "flex-shrink-0 border-r border-slate-200 flex items-center justify-center", style: { width: DAY_WIDTH }, title: date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), children: _jsxs("span", { className: "text-xs text-slate-500", children: [label.split(' ')[1], _jsx("br", {}), label.split(' ')[0]] }) }, dayIndex)))] }), _jsxs("div", { className: "relative", children: [timelineItems.map((item, rowIndex) => {
                            if (!item.startDate || !item.endDate)
                                return null;
                            const startOffsetDays = getDaysDiff(overallMinDate, item.startDate);
                            const durationDays = getDaysDiff(item.startDate, item.endDate) + 1; // Inclusive
                            const itemLeft = LABEL_WIDTH + startOffsetDays * DAY_WIDTH;
                            const itemWidth = durationDays * DAY_WIDTH - 2; // -2 for slight gap
                            return (_jsxs("div", { className: "flex items-center border-b border-slate-200 hover:bg-slate-50", style: { height: ROW_HEIGHT_TIMELINE, top: HEADER_HEIGHT + rowIndex * ROW_HEIGHT_TIMELINE }, children: [_jsx("div", { className: "sticky left-0 z-10 w-[150px] px-2 py-1 border-r border-slate-300 bg-white group-hover:bg-slate-50 flex items-center", children: _jsx("span", { className: "text-xs text-slate-700 truncate", title: item.label, children: item.label }) }), _jsx("div", { className: "absolute h-[70%] bg-sky-500 rounded hover:bg-sky-600 transition-colors", style: {
                                            left: itemLeft,
                                            width: Math.max(DAY_WIDTH / 2, itemWidth), // min width for milestones
                                            top: '15%', // Center vertically
                                        }, title: `${item.label}: ${formatDate(item.startDate)} - ${formatDate(item.endDate)}`, children: _jsx("span", { className: "absolute left-1 top-0 bottom-0 flex items-center text-[10px] text-white font-medium overflow-hidden pr-1", children: item.label }) })] }, item.id));
                        }), dateHeaders.map(({ dayIndex }) => (_jsx("div", { className: "absolute top-0 bottom-0 border-r border-slate-100", style: { left: LABEL_WIDTH + dayIndex * DAY_WIDTH, zIndex: -1, height: HEADER_HEIGHT + timelineItems.length * ROW_HEIGHT_TIMELINE } }, `grid-${dayIndex}`)))] }), timelineItems.length === 0 && (_jsx("div", { className: "p-8 text-center text-slate-400", style: { top: HEADER_HEIGHT, position: 'absolute', width: '100%' }, children: "No items with valid dates to display in this timeline." }))] }) }));
};
export default TimelineView;
//# sourceMappingURL=TimelineView.js.map