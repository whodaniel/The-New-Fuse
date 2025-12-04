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
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import fs from 'fs/promises';
import path from 'path';
import { logger } from './logger';
var VisualRegression = /** @class */ (function () {
    function VisualRegression() {
    }
    VisualRegression.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fs.mkdir(this.SCREENSHOTS_DIR, { recursive: true })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, fs.mkdir(this.DIFFS_DIR, { recursive: true })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    VisualRegression.compareScreenshot = function (driver_1, name_1) {
        return __awaiter(this, arguments, void 0, function (driver, name, threshold) {
            var screenshot, screenshotBuffer, baselinePath, diffPath, baseline, img1, img2, width, height, diff, numDiffPixels, diffPercentage, error_1;
            if (threshold === void 0) { threshold = 0.1; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, driver.takeScreenshot()];
                    case 1:
                        screenshot = _a.sent();
                        screenshotBuffer = Buffer.from(screenshot, 'base64');
                        baselinePath = path.join(this.SCREENSHOTS_DIR, "".concat(name, "-baseline.png"));
                        diffPath = path.join(this.DIFFS_DIR, "".concat(name, "-diff.png"));
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 6, , 9]);
                        return [4 /*yield*/, fs.readFile(baselinePath)];
                    case 3:
                        baseline = _a.sent();
                        img1 = PNG.sync.read(baseline);
                        img2 = PNG.sync.read(screenshotBuffer);
                        width = img1.width, height = img1.height;
                        diff = new PNG({ width: width, height: height });
                        numDiffPixels = pixelmatch(img1.data, img2.data, diff.data, width, height, { threshold: threshold });
                        diffPercentage = (numDiffPixels / (width * height)) * 100;
                        if (!(diffPercentage > threshold * 100)) return [3 /*break*/, 5];
                        return [4 /*yield*/, fs.writeFile(diffPath, PNG.sync.write(diff))];
                    case 4:
                        _a.sent();
                        logger.warn("Visual difference detected for ".concat(name, ": ").concat(diffPercentage.toFixed(2), "%"));
                        return [2 /*return*/, false];
                    case 5: return [2 /*return*/, true];
                    case 6:
                        error_1 = _a.sent();
                        if (!(error_1 && typeof error_1 === 'object' && 'code' in error_1 && error_1.code === 'ENOENT')) return [3 /*break*/, 8];
                        // Baseline doesn't exist, create it
                        return [4 /*yield*/, fs.writeFile(baselinePath, screenshotBuffer)];
                    case 7:
                        // Baseline doesn't exist, create it
                        _a.sent();
                        logger.info("Created baseline for ".concat(name));
                        return [2 /*return*/, true];
                    case 8: throw error_1;
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    VisualRegression.SCREENSHOTS_DIR = 'test-screenshots';
    VisualRegression.DIFFS_DIR = 'test-diffs';
    return VisualRegression;
}());
export { VisualRegression };
