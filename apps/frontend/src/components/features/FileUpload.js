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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUpload = void 0;
import react_1 from 'react';
import react_dropzone_1 from 'react-dropzone';
import Button_1 from '../../../core/Button';
import react_hot_toast_1 from 'react-hot-toast';
import websocket_1 from '../../../../services/websocket';
var FileUpload = function (_a) {
    var onUploadComplete = _a.onUploadComplete, disabled = _a.disabled;
    var onDrop = (0, react_1.useCallback)(function (acceptedFiles) { return __awaiter(void 0, void 0, void 0, function () {
        var _i, acceptedFiles_1, file, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    _i = 0, acceptedFiles_1 = acceptedFiles;
                    _a.label = 1;
                case 1:
                    if (!(_i < acceptedFiles_1.length)) return [3 /*break*/, 4];
                    file = acceptedFiles_1[_i];
                    if (file.size > 10 * 1024 * 1024) {
                        react_hot_toast_1.toast.error("File ".concat(file.name, " is too large. Maximum size is 10MB"));
                        return [3 /*break*/, 3];
                    }
                    return [4 /*yield*/, websocket_1.default.uploadFile(file, {
                            type: 'chat_attachment',
                            timestamp: new Date().toISOString(),
                        })];
                case 2:
                    _a.sent();
                    onUploadComplete === null || onUploadComplete === void 0 ? void 0 : onUploadComplete({
                        id: Math.random().toString(36).substring(7),
                        url: URL.createObjectURL(file),
                        name: file.name,
                    });
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [3 /*break*/, 6];
                case 5:
                    error_1 = _a.sent();
                    console.error('File upload error:', error_1);
                    react_hot_toast_1.toast.error('Failed to upload file');
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); }, [onUploadComplete]);
    var _b = (0, react_dropzone_1.useDropzone)({
        onDrop: onDrop,
        disabled: disabled,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
            'application/pdf': ['.pdf'],
            'text/*': ['.txt', '.md'],
            'application/json': ['.json'],
        },
        maxFiles: 5,
    }), getRootProps = _b.getRootProps, getInputProps = _b.getInputProps, isDragActive = _b.isDragActive;
    return (_jsxs("div", __assign({}, getRootProps(), { className: "\n        border-2 border-dashed rounded-lg p-4 text-center cursor-pointer\n        transition-colors duration-200 ease-in-out\n        ".concat(isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300', "\n        ").concat(disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5', "\n      "), children: [_jsx("input", __assign({}, getInputProps())), _jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "text-sm text-gray-600", children: isDragActive ? (_jsx("p", { children: "Drop the files here ..." })) : (_jsx("p", { children: "Drag & drop files here, or click to select files" })) }), _jsx("div", { className: "text-xs text-gray-500", children: "Supported files: Images, PDF, Text, JSON (Max 10MB)" }), _jsx(Button_1.Button, { type: "button", variant: "outline", size: "sm", disabled: disabled, onClick: function (e) { return e.stopPropagation(); }, children: "Select Files" })] })] })));
};
exports.FileUpload = FileUpload;
exports.default = exports.FileUpload;
