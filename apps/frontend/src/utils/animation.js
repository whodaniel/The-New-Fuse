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
export function animate(element, keyframes, options) {
    if (options === void 0) { options = {}; }
    var _a = options.duration, duration = _a === void 0 ? 300 : _a, _b = options.easing, easing = _b === void 0 ? 'ease-in-out' : _b, _c = options.delay, delay = _c === void 0 ? 0 : _c;
    return element.animate(keyframes, {
        duration: duration,
        easing: easing,
        delay: delay,
        fill: 'forwards',
    });
}
export function fadeIn(element, options) {
    if (options === void 0) { options = {}; }
    return animate(element, [
        { opacity: 0 },
        { opacity: 1 }
    ], options);
}
export function fadeOut(element, options) {
    if (options === void 0) { options = {}; }
    return animate(element, [
        { opacity: 1 },
        { opacity: 0 }
    ], options);
}
export function slideIn(element, direction, options) {
    if (direction === void 0) { direction = 'right'; }
    if (options === void 0) { options = {}; }
    var start = {
        left: { transform: 'translateX(-100%)' },
        right: { transform: 'translateX(100%)' },
        top: { transform: 'translateY(-100%)' },
        bottom: { transform: 'translateY(100%)' },
    };
    return animate(element, [
        start[direction],
        { transform: 'translate(0)' }
    ], options);
}
export function slideOut(element, direction, options) {
    if (direction === void 0) { direction = 'right'; }
    if (options === void 0) { options = {}; }
    var end = {
        left: { transform: 'translateX(-100%)' },
        right: { transform: 'translateX(100%)' },
        top: { transform: 'translateY(-100%)' },
        bottom: { transform: 'translateY(100%)' },
    };
    return animate(element, [
        { transform: 'translate(0)' },
        end[direction]
    ], options);
}
export function transition(element, properties, options) {
    if (options === void 0) { options = {}; }
    var _a = options.duration, duration = _a === void 0 ? 300 : _a, _b = options.easing, easing = _b === void 0 ? 'ease-in-out' : _b, _c = options.delay, delay = _c === void 0 ? 0 : _c, onStart = options.onStart, onComplete = options.onComplete, onCancel = options.onCancel;
    return new Promise(function (resolve, reject) {
        var originalTransition = element.style.transition;
        var transitionString = properties
            .map(function (prop) { return "".concat(prop, " ").concat(duration, "ms ").concat(easing); })
            .join(', ');
        var cleanup = function () {
            element.style.transition = originalTransition;
            element.removeEventListener('transitionend', handleComplete);
            element.removeEventListener('transitioncancel', handleCancel);
        };
        var handleComplete = function () {
            cleanup();
            onComplete === null || onComplete === void 0 ? void 0 : onComplete();
            resolve();
        };
        var handleCancel = function () {
            cleanup();
            onCancel === null || onCancel === void 0 ? void 0 : onCancel();
            reject(new Error('Transition cancelled'));
        };
        element.addEventListener('transitionend', handleComplete);
        element.addEventListener('transitioncancel', handleCancel);
        requestAnimationFrame(function () {
            element.style.transition = transitionString;
            onStart === null || onStart === void 0 ? void 0 : onStart();
        });
        // Set timeout as fallback
        setTimeout(handleComplete, duration + delay + 100);
    });
}
export function collapse(element_1) {
    return __awaiter(this, arguments, void 0, function (element, options) {
        var height;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    height = element.getBoundingClientRect().height;
                    element.style.height = "".concat(height, "px");
                    // Force repaint
                    element.offsetHeight;
                    return [4 /*yield*/, transition(element, ['height'], __assign(__assign({}, options), { onStart: function () {
                                var _a;
                                element.style.height = '0';
                                (_a = options.onStart) === null || _a === void 0 ? void 0 : _a.call(options);
                            } }))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
export function expand(element_1) {
    return __awaiter(this, arguments, void 0, function (element, options) {
        var height;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    element.style.height = 'auto';
                    height = element.getBoundingClientRect().height;
                    element.style.height = '0';
                    // Force repaint
                    element.offsetHeight;
                    return [4 /*yield*/, transition(element, ['height'], __assign(__assign({}, options), { onStart: function () {
                                var _a;
                                element.style.height = "".concat(height, "px");
                                (_a = options.onStart) === null || _a === void 0 ? void 0 : _a.call(options);
                            }, onComplete: function () {
                                var _a;
                                element.style.height = 'auto';
                                (_a = options.onComplete) === null || _a === void 0 ? void 0 : _a.call(options);
                            } }))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
