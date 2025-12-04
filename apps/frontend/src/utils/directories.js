var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
export function middleTruncate(str, maxLength) {
    if (str.length <= maxLength)
        return str;
    var ellipsis = "...";
    var charsToShow = maxLength - ellipsis.length;
    var frontChars = Math.ceil(charsToShow / 2);
    var backChars = Math.floor(charsToShow / 2);
    return str.slice(0, frontChars) + ellipsis + str.slice(str.length - backChars);
}
export function truncateFileExtension(filename) {
    var parts = filename.split(".");
    if (parts.length <= 1)
        return filename;
    return parts.slice(0, -1).join(".");
}
export function getFileExtension(filename) {
    var parts = filename.split(".");
    if (parts.length <= 1)
        return "";
    return parts[parts.length - 1].toLowerCase();
}
export function isImageByExtension(filename) {
    var ext = getFileExtension(filename);
    return ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext);
}
export function isVideoByExtension(filename) {
    var ext = getFileExtension(filename);
    return ["mp4", "webm", "ogg", "mov", "avi"].includes(ext);
}
export function isAudioByExtension(filename) {
    var ext = getFileExtension(filename);
    return ["mp3", "wav", "ogg", "m4a", "aac"].includes(ext);
}
export function isPDFByExtension(filename) {
    var ext = getFileExtension(filename);
    return ext === "pdf";
}
export function isTextByExtension(filename) {
    var ext = getFileExtension(filename);
    return [
        "txt", "md", "json", "csv", "yml", "yaml", "xml",
        "html", "htm", "css", "js", "ts", "jsx", "tsx"
    ].includes(ext);
}
export function normalizePath(path) {
    return path.replace(/\\/g, '/');
}
export function getFileName(path) {
    return normalizePath(path).split('/').pop() || '';
}
export function getFileNameWithoutExtension(fileName) {
    var extension = getFileExtension(fileName);
    return extension ? fileName.slice(0, -(extension.length + 1)) : fileName;
}
export function getDirectoryPath(path) {
    var normalized = normalizePath(path);
    return normalized.substring(0, normalized.lastIndexOf('/')) || '/';
}
export function joinPaths() {
    var paths = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        paths[_i] = arguments[_i];
    }
    return normalizePath(paths.map(function (path) { return path.replace(/^\/|\/$/g, ''); }).join('/'));
}
export function isSubPath(parent, child) {
    var normalizedParent = normalizePath(parent);
    var normalizedChild = normalizePath(child);
    return normalizedChild.startsWith(normalizedParent);
}
export function getRelativePath(from, to) {
    var fromParts = normalizePath(from).split('/');
    var toParts = normalizePath(to).split('/');
    while (fromParts.length > 0 && toParts.length > 0 && fromParts[0] === toParts[0]) {
        fromParts.shift();
        toParts.shift();
    }
    return __spreadArray(__spreadArray([], Array(fromParts.length).fill('..'), true), toParts, true).join('/');
}
export function getPathDepth(path) {
    return normalizePath(path).split('/').filter(Boolean).length;
}
export function getCommonPath(paths) {
    if (paths.length === 0)
        return '';
    if (paths.length === 1)
        return getDirectoryPath(paths[0]);
    var parts = paths.map(function (path) { return normalizePath(path).split('/'); });
    var minLength = Math.min.apply(Math, parts.map(function (p) { return p.length; }));
    var commonParts = [];
    var _loop_1 = function (i) {
        var part = parts[0][i];
        if (parts.every(function (p) { return p[i] === part; })) {
            commonParts.push(part);
        }
        else {
            return "break";
        }
    };
    for (var i = 0; i < minLength; i++) {
        var state_1 = _loop_1(i);
        if (state_1 === "break")
            break;
    }
    return commonParts.join('/');
}
export function isValidFileName(fileName) {
    // Check for invalid characters in file names
    // eslint-disable-next-line no-control-regex
    var invalidChars = /[<>:"/\\|?*\x00-\x1F]/;
    return !invalidChars.test(fileName) && fileName.trim() === fileName && fileName !== '.' && fileName !== '..';
}
export function sanitizeFileName(fileName) {
    // Replace invalid characters with underscores
    return fileName
        // eslint-disable-next-line no-control-regex
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
        .replace(/\s+/g, '_')
        .replace(/^\.+/, '_')
        .trim();
}
export function parsePathParts(path) {
    var normalized = normalizePath(path);
    var fileName = getFileName(normalized);
    var ext = getFileExtension(fileName);
    var name = getFileNameWithoutExtension(fileName);
    var dir = getDirectoryPath(normalized);
    var root = dir.split('/')[0] || '/';
    return {
        root: root,
        dir: dir,
        name: name,
        ext: ext
    };
}
