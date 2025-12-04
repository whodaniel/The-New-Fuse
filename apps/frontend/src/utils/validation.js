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
export function validateRequired(value) {
    return value !== undefined && value !== null && value !== ''
        ? true
        : 'This field is required';
}
export function validateEmail(email) {
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) ? true : 'Invalid email address';
}
export function validateUrl(url) {
    try {
        new URL(url);
        return true;
    }
    catch (_a) {
        return 'Invalid URL';
    }
}
export function validateMinLength(value, min) {
    return value.length >= min ? true : "Minimum length is ".concat(min, " characters");
}
export function validateMaxLength(value, max) {
    return value.length <= max ? true : "Maximum length is ".concat(max, " characters");
}
export function validatePattern(value, pattern) {
    return pattern.test(value) ? true : 'Invalid format';
}
export function validateMin(value, min) {
    return value >= min ? true : "Minimum value is ".concat(min);
}
export function validateMax(value, max) {
    return value <= max ? true : "Maximum value is ".concat(max);
}
export function validate(value, options) {
    var errors = [];
    if (options.required && !validateRequired(value)) {
        errors.push('This field is required');
    }
    if (value) {
        if (options.email && typeof value === 'string') {
            var result = validateEmail(value);
            if (typeof result === 'string')
                errors.push(result);
        }
        if (options.url && typeof value === 'string') {
            var result = validateUrl(value);
            if (typeof result === 'string')
                errors.push(result);
        }
        if (options.minLength !== undefined && typeof value === 'string') {
            var result = validateMinLength(value, options.minLength);
            if (typeof result === 'string')
                errors.push(result);
        }
        if (options.maxLength !== undefined && typeof value === 'string') {
            var result = validateMaxLength(value, options.maxLength);
            if (typeof result === 'string')
                errors.push(result);
        }
        if (options.pattern && typeof value === 'string') {
            var result = validatePattern(value, options.pattern);
            if (typeof result === 'string')
                errors.push(result);
        }
        if (options.min !== undefined && typeof value === 'number') {
            var result = validateMin(value, options.min);
            if (typeof result === 'string')
                errors.push(result);
        }
        if (options.max !== undefined && typeof value === 'number') {
            var result = validateMax(value, options.max);
            if (typeof result === 'string')
                errors.push(result);
        }
        if (options.custom) {
            var result = options.custom(value);
            if (typeof result === 'string')
                errors.push(result);
        }
    }
    return errors;
}
export function validateForm(values, rules) {
    var errors = {};
    Object.entries(rules).forEach(function (_a) {
        var field = _a[0], options = _a[1];
        var fieldErrors = validate(values[field], options);
        if (fieldErrors.length > 0) {
            errors[field] = fieldErrors;
        }
    });
    return errors;
}
export function hasErrors(errors) {
    return Object.keys(errors).length > 0;
}
export function getFirstError(fieldErrors) {
    return fieldErrors[0] || '';
}
export function validate(value, rules) {
    var errors = rules
        .filter(function (rule) { return !rule.validate(value); })
        .map(function (rule) { return rule.message; });
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}
// Common validation rules
export var required = function (message) {
    if (message === void 0) { message = 'This field is required'; }
    return ({
        validate: function (value) {
            if (value === null || value === undefined)
                return false;
            if (typeof value === 'string')
                return value.trim().length > 0;
            if (Array.isArray(value))
                return value.length > 0;
            return true;
        },
        message: message
    });
};
export var minLength = function (min, message) { return ({
    validate: function (value) { return value.length >= min; },
    message: message || "Must be at least ".concat(min, " characters")
}); };
export var maxLength = function (max, message) { return ({
    validate: function (value) { return value.length <= max; },
    message: message || "Must be no more than ".concat(max, " characters")
}); };
export var email = function (message) {
    if (message === void 0) { message = 'Must be a valid email address'; }
    return ({
        validate: function (value) {
            var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(value);
        },
        message: message
    });
};
export var url = function (message) {
    if (message === void 0) { message = 'Must be a valid URL'; }
    return ({
        validate: function (value) {
            try {
                new URL(value);
                return true;
            }
            catch (_a) {
                return false;
            }
        },
        message: message
    });
};
export var numeric = function (message) {
    if (message === void 0) { message = 'Must be a number'; }
    return ({
        validate: function (value) { return !isNaN(Number(value)); },
        message: message
    });
};
export var integer = function (message) {
    if (message === void 0) { message = 'Must be an integer'; }
    return ({
        validate: function (value) {
            var num = typeof value === 'string' ? Number(value) : value;
            return Number.isInteger(num);
        },
        message: message
    });
};
export var min = function (min, message) { return ({
    validate: function (value) { return value >= min; },
    message: message || "Must be at least ".concat(min)
}); };
export var max = function (max, message) { return ({
    validate: function (value) { return value <= max; },
    message: message || "Must be no more than ".concat(max)
}); };
export var pattern = function (regex, message) { return ({
    validate: function (value) { return regex.test(value); },
    message: message
}); };
export var matchValue = function (matchTo, message) { return ({
    validate: function (value) { return value === matchTo; },
    message: message || 'Values must match'
}); };
export function validateForm(values, validationRules) {
    var errors = {};
    var isValid = true;
    validationRules.forEach(function (_a) {
        var field = _a.field, rules = _a.rules;
        var result = validate(values[field], rules);
        if (!result.isValid) {
            errors[field] = result.errors;
            isValid = false;
        }
    });
    return { isValid: isValid, errors: errors };
}
export function validateAsync(value, rules) {
    return __awaiter(this, void 0, void 0, function () {
        var results, errors;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Promise.all(rules.map(function (rule) { return __awaiter(_this, void 0, void 0, function () {
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _a = {};
                                    return [4 /*yield*/, rule.validate(value)];
                                case 1: return [2 /*return*/, (_a.isValid = _b.sent(),
                                        _a.message = rule.message,
                                        _a)];
                            }
                        });
                    }); }))];
                case 1:
                    results = _a.sent();
                    errors = results
                        .filter(function (result) { return !result.isValid; })
                        .map(function (result) { return result.message; });
                    return [2 /*return*/, {
                            isValid: errors.length === 0,
                            errors: errors
                        }];
            }
        });
    });
}
