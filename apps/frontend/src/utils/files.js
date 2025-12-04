var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { getFileExtension } from './directories';
export function getFileInfo(file) {
    return {
        name: file.name,
        size: file.size,
        type: file.type,
        extension: getFileExtension(file.name),
        lastModified: file.lastModified,
    };
}
export function validateFile(file, options) {
    if (options === void 0) { options = {}; }
    var errors = [];
    var maxSize = options.maxSize, allowedTypes = options.allowedTypes;
    if (maxSize && file.size > maxSize) {
        errors.push("File size exceeds ".concat(formatFileSize(maxSize)));
    }
    if (allowedTypes && allowedTypes.length > 0) {
        var ext = getFileExtension(file.name).toLowerCase();
        if (!allowedTypes.includes(ext)) {
            errors.push("File type .".concat(ext, " is not allowed. Allowed types: ").concat(allowedTypes.join(', ')));
        }
    }
    return {
        valid: errors.length === 0,
        errors: errors,
    };
}
export function validateFiles(files, options) {
    if (options === void 0) { options = {}; }
    var errors = [];
    var maxFiles = options.maxFiles;
    if (maxFiles && files.length > maxFiles) {
        errors.push("Maximum ".concat(maxFiles, " files allowed"));
        return { valid: false, errors: errors };
    }
    var fileErrors = files.map(function (file) { return validateFile(file, options); });
    var allErrors = fileErrors.reduce(function (acc, result) { return __spreadArray(__spreadArray([], acc, true), result.errors, true); }, []);
    return {
        valid: allErrors.length === 0,
        errors: allErrors,
    };
}
export function readFileAsDataURL(file) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var reader = new FileReader();
                    reader.onload = function () {
                        if (typeof reader.result === 'string') {
                            resolve(reader.result);
                        }
                        else {
                            reject(new Error('Failed to read file as data URL'));
                        }
                    };
                    reader.onerror = function () { return reject(new Error('Failed to read file')); };
                    reader.readAsDataURL(file);
                })];
        });
    });
}
export function readFileAsText(file) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var reader = new FileReader();
                    reader.onload = function () {
                        if (typeof reader.result === 'string') {
                            resolve(reader.result);
                        }
                        else {
                            reject(new Error('Failed to read file as text'));
                        }
                    };
                    reader.onerror = function () { return reject(new Error('Failed to read file')); };
                    reader.readAsText(file);
                })];
        });
    });
}
export function formatFileSize(bytes) {
    if (bytes === 0)
        return '0 Bytes';
    var k = 1024;
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return "".concat(parseFloat((bytes / Math.pow(k, i)).toFixed(2)), " ").concat(sizes[i]);
}
export function downloadFile(url, filename) {
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
export function downloadBlob(blob, filename) {
    return __awaiter(this, void 0, void 0, function () {
        var url;
        return __generator(this, function (_a) {
            url = URL.createObjectURL(blob);
            downloadFile(url, filename);
            URL.revokeObjectURL(url);
            return [2 /*return*/];
        });
    });
}
export function getMimeType(filename) {
    var ext = getFileExtension(filename).toLowerCase();
    var mimeTypes = {
        txt: 'text/plain',
        html: 'text/html',
        css: 'text/css',
        js: 'text/javascript',
        json: 'application/json',
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
        svg: 'image/svg+xml',
        pdf: 'application/pdf',
    };
    return mimeTypes[ext] || 'application/octet-stream';
}
