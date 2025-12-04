export function toPercentString(num) {
    if (num === null || num === undefined)
        return "0%";
    return "".concat(Math.round(num * 100), "%");
}
export function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
}
export function formatPrice(price) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(price);
}
export function formatCompactNumber(num) {
    return new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1
    }).format(num);
}
export function clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
}
export function roundToDecimalPlaces(num, places) {
    var factor = Math.pow(10, places);
    return Math.round(num * factor) / factor;
}
