var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/shared/ui/core/Card';
import { Button } from '@/shared/ui/core/Button';
import { Progress } from '@/shared/ui/core/Progress';
import { cn } from '@/lib/utils';
export function FileUpload(_a) {
    var _this = this;
    var onUpload = _a.onUpload, _b = _a.maxSize, maxSize = _b === void 0 ? 10 * 1024 * 1024 : _b, _c = _a.acceptedTypes, acceptedTypes = _c === void 0 ? {
        'image/*': [],
        'application/pdf': [],
        'text/*': []
    } : _c, _d = _a.multiple, multiple = _d === void 0 ? true : _d, _e = _a.maxFiles, maxFiles = _e === void 0 ? 5 : _e, className = _a.className;
    var _f = React.useState([]), uploadingFiles = _f[0], setUploadingFiles = _f[1];
    var _g = React.useState(false), isUploading = _g[0], setIsUploading = _g[1];
    var onDrop = React.useCallback(function (acceptedFiles) { return __awaiter(_this, void 0, void 0, function () {
        var newFiles, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (acceptedFiles.length === 0)
                        return [2 /*return*/];
                    newFiles = acceptedFiles.map(function (file) { return ({
                        file: file,
                        progress: 0
                    }); });
                    setUploadingFiles(function (prev) { return __spreadArray(__spreadArray([], prev, true), newFiles, true); });
                    setIsUploading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, onUpload(acceptedFiles)];
                case 2:
                    _a.sent();
                    setUploadingFiles(function (prev) { return prev.map(function (f) { return (Object.assign(Object.assign({}, f), { progress: 100 })); }); });
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    setUploadingFiles(function (prev) { return prev.map(function (f) { return (Object.assign(Object.assign({}, f), { error: 'Upload failed' })); }); });
                    return [3 /*break*/, 5];
                case 4:
                    setIsUploading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [onUpload]);
    var _h = useDropzone({
        onDrop: onDrop,
        maxSize: maxSize,
        accept: acceptedTypes,
        multiple: multiple,
        maxFiles: maxFiles
    }), getRootProps = _h.getRootProps, getInputProps = _h.getInputProps, isDragActive = _h.isDragActive;
    var removeFile = function (index) {
        setUploadingFiles(function (prev) { return prev.filter(function (_, i) { return i !== index; }); });
    };
    var formatFileSize = function (bytes) {
        if (bytes === 0)
            return '0 Bytes';
        var k = 1024;
        var sizes = ['Bytes', 'KB', 'MB', 'GB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    return (_jsx(Card, { className: cn("w-full", className), children: _jsxs("div", { className: "p-6", children: [_jsxs("div", __assign({}, getRootProps(), { className: cn("border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors duration-200", isDragActive
                        ? "border-primary bg-primary/5"
                        : "border-gray-300 hover:border-primary/50"), children: [_jsx("input", __assign({}, getInputProps())), _jsxs("div", { className: "flex flex-col items-center gap-4", children: [_jsx("div", { className: "rounded-full bg-primary/10 p-4", children: _jsx("svg", { className: "w-6 h-6 text-primary", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" }) }) }), isDragActive ? (_jsx("p", { className: "text-primary font-medium", children: "Drop the files here..." })) : (_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-gray-600", children: "Drag and drop files here, or click to select files" }), _jsxs("p", { className: "text-sm text-gray-500", children: ["Maximum file size: ", formatFileSize(maxSize)] }), _jsxs("p", { className: "text-sm text-gray-500", children: ["Accepted types: ", Object.keys(acceptedTypes).join(', ')] })] }))] })] })), uploadingFiles.length > 0 && (_jsx("div", { className: "mt-6 space-y-4", children: uploadingFiles.map(function (file, index) { return (_jsx("div", { className: "flex items-center gap-4 p-4 bg-gray-50 rounded-lg", children: _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { className: "truncate", children: [_jsx("p", { className: "text-sm font-medium text-gray-900 truncate", children: file.file.name }), _jsx("p", { className: "text-sm text-gray-500", children: formatFileSize(file.file.size) })] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: function () { return removeFile(index); }, className: "ml-2", children: _jsx("svg", { className: "w-4 h-4", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) })] }), _jsx("div", { className: "mt-2", children: file.error ? (_jsx("p", { className: "text-sm text-red-600", children: file.error })) : (_jsx(Progress, { value: file.progress, className: "h-1" })) })] }) }, file.file.name + index)); }) }))] }) }));
}
