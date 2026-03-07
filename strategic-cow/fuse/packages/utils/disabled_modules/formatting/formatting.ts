
export {}
exports.msToMinutes = exports.formatDuration = void 0;
function formatDuration(durationInMs): any {
    const totalSeconds = Math.floor(durationInMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}
exports.formatDuration = formatDuration;
const msToMinutes = (ms): any => Math.ceil(ms / 60000);
exports.msToMinutes = msToMinutes;
//# sourceMappingURL=formatting.js.mapexport {};
