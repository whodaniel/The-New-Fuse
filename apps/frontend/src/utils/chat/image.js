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
import { getFileExtension } from '../directories';
export function getImageDimensions(file) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var img = new Image();
                    img.onload = function () {
                        resolve({
                            width: img.width,
                            height: img.height
                        });
                    };
                    img.onerror = function () { return reject(new Error('Failed to load image')); };
                    img.src = URL.createObjectURL(file);
                })];
        });
    });
}
export function resizeImage(file_1) {
    return __awaiter(this, arguments, void 0, function (file, options) {
        var _a, maxWidth, _b, maxHeight, _c, maintainAspectRatio, _d, format, _e, quality;
        var _this = this;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_f) {
            _a = options.maxWidth, maxWidth = _a === void 0 ? 1920 : _a, _b = options.maxHeight, maxHeight = _b === void 0 ? 1080 : _b, _c = options.maintainAspectRatio, maintainAspectRatio = _c === void 0 ? true : _c, _d = options.format, format = _d === void 0 ? 'jpeg' : _d, _e = options.quality, quality = _e === void 0 ? 0.8 : _e;
            return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                    var img_1;
                    return __generator(this, function (_a) {
                        try {
                            img_1 = new Image();
                            img_1.onload = function () {
                                var width = img_1.width;
                                var height = img_1.height;
                                if (maintainAspectRatio) {
                                    if (width > maxWidth) {
                                        height = (height * maxWidth) / width;
                                        width = maxWidth;
                                    }
                                    if (height > maxHeight) {
                                        width = (width * maxHeight) / height;
                                        height = maxHeight;
                                    }
                                }
                                else {
                                    width = Math.min(width, maxWidth);
                                    height = Math.min(height, maxHeight);
                                }
                                var canvas = document.createElement('canvas');
                                canvas.width = width;
                                canvas.height = height;
                                var ctx = canvas.getContext('2d');
                                if (!ctx) {
                                    throw new Error('Failed to get canvas context');
                                }
                                ctx.drawImage(img_1, 0, 0, width, height);
                                canvas.toBlob(function (blob) {
                                    if (!blob) {
                                        reject(new Error('Failed to create blob'));
                                        return;
                                    }
                                    resolve(blob);
                                }, "image/".concat(format), quality);
                            };
                            img_1.onerror = function () { return reject(new Error('Failed to load image')); };
                            img_1.src = URL.createObjectURL(file);
                        }
                        catch (error) {
                            reject(error);
                        }
                        return [2 /*return*/];
                    });
                }); })];
        });
    });
}
export function isImage(file) {
    var ext = getFileExtension(file.name).toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
}
export function createImageThumbnail(file) {
    var _this = this;
    return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
        var resized, reader_1, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, resizeImage(file, {
                            maxWidth: 200,
                            maxHeight: 200,
                            format: 'jpeg',
                            quality: 0.7
                        })];
                case 1:
                    resized = _a.sent();
                    reader_1 = new FileReader();
                    reader_1.onloadend = function () {
                        if (typeof reader_1.result === 'string') {
                            resolve(reader_1.result);
                        }
                        else {
                            reject(new Error('Failed to create thumbnail'));
                        }
                    };
                    reader_1.onerror = function () { return reject(new Error('Failed to read file')); };
                    reader_1.readAsDataURL(resized);
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    reject(error_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
}
export function getImagePlaceholder(mimeType) {
    // Return a base64 encoded placeholder image based on mime type
    // You can implement different placeholders for different image types
    return 'data:image/svg+xml;base64,...'; // Implement your placeholder logic
}
