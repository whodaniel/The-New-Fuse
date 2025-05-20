export function formatDate(dateString): any {
    const date = isNaN(new Date(dateString).getTime())
        ? new Date()
        : new Date(dateString);
    const options = { year: "numeric", month: "short", day: "numeric" };
    const formattedDate = date.toLocaleDateString("en-US", options);
    return formattedDate;
}
export function getFileExtension(path): any {
    var _a, _b;
    return ((_b = (_a = path === null || path === void 0 ? void 0 : path.split(".")) === null || _a === void 0 ? void 0 : _a.slice(-1)) === null || _b === void 0 ? void 0 : _b[0]) || "file";
}
export function middleTruncate(str, n): any {
    const fileExtensionPattern = /([^.]*)$/;
    const extensionMatch = str.includes(".") && str.match(fileExtensionPattern);
    if (str.length <= n)
        return str;
    if (extensionMatch && extensionMatch[1]) {
        const extension = extensionMatch[1];
        const nameWithoutExtension = str.replace(fileExtensionPattern, "");
        const truncationPoint = Math.max(0, n - extension.length - 4);
        const truncatedName = nameWithoutExtension.substr(0, truncationPoint) +
            "..." +
            nameWithoutExtension.slice(-4);
        return truncatedName + extension;
    }
    else {
        return str.length > n ? str.substr(0, n - 8) + "..." + str.slice(-4) : str;
    }
}
//# sourceMappingURL=directories.js.map