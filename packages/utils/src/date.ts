
export {}
exports.parseDate = exports.formatDate = void 0;
function formatDate(date: Date): any {
    const d = new Date(date);
    return d.toISOString();
}
exports.formatDate = formatDate;
function parseDate(dateStr: string): any {
    return new Date(dateStr);
}
exports.parseDate = parseDate;
//# sourceMappingURL=date.js.mapexport {};
