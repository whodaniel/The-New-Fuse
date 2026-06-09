import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function DataTable({ data, columns, className = '', onRowClick }) {
    return (_jsx("div", { className: `overflow-x-auto ${className}`, children: _jsxs("table", { className: "min-w-full divide-y divide-border/50", children: [_jsx("thead", { className: "bg-transparent", children: _jsx("tr", { children: columns.map((column, idx) => (_jsx("th", { scope: "col", className: "px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground/80", style: { width: column.width }, children: column.header }, idx))) }) }), _jsx("tbody", { className: "bg-transparent divide-y divide-border/40", children: data.map((item, rowIdx) => (_jsx("tr", { onClick: () => onRowClick?.(item), className: onRowClick ? 'cursor-pointer hover:bg-muted/30' : '', children: columns.map((column, colIdx) => (_jsx("td", { className: "px-3 py-2 whitespace-nowrap text-sm text-muted-foreground", children: typeof column.accessor === 'function'
                                ? column.accessor(item)
                                : String(item[column.accessor] || '') }, colIdx))) }, rowIdx))) })] }) }));
}
export { DataTable, DataTable as Table };
