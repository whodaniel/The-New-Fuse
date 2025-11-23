exports.parseDate = exports.formatDate = void 0;
function formatDate(date) {
    const d = new Date(date);
    return d.toISOString();
}
exports.formatDate = formatDate;
function parseDate(dateStr) {
    return new Date(dateStr);
}
exports.parseDate = parseDate;
export {};
//# sourceMappingURL=date.js.mapexport {};
//# sourceMappingURL=date.js.map