var Validator = /** @class */ (function () {
    function Validator() {
        this.rules = new Map();
    }
    Validator.prototype.addRule = function (field, rule) {
        if (!this.rules.has(field)) {
            this.rules.set(field, []);
        }
        this.rules.get(field).push(rule);
    };
    Validator.prototype.validate = function (data) {
        var errors = [];
        for (var _i = 0, _a = this.rules.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], field = _b[0], rules = _b[1];
            var value = data[field];
            for (var _c = 0, rules_1 = rules; _c < rules_1.length; _c++) {
                var rule = rules_1[_c];
                if (!rule.validate(value)) {
                    errors.push("".concat(field, ": ").concat(rule.message));
                }
            }
        }
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    };
    return Validator;
}());
export { Validator };
export var ValidationRules = {
    required: function (message) {
        if (message === void 0) { message = 'This field is required'; }
        return ({
            validate: function (value) { return value !== undefined && value !== null && value !== ''; },
            message: message
        });
    },
    minLength: function (length, message) {
        if (message === void 0) { message = "Minimum length is ".concat(length); }
        return ({
            validate: function (value) { return value.length >= length; },
            message: message
        });
    },
    maxLength: function (length, message) {
        if (message === void 0) { message = "Maximum length is ".concat(length); }
        return ({
            validate: function (value) { return value.length <= length; },
            message: message
        });
    },
    pattern: function (regex, message) { return ({
        validate: function (value) { return regex.test(value); },
        message: message
    }); },
    email: function (message) {
        if (message === void 0) { message = 'Invalid email address'; }
        return ({
            validate: function (value) { return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value); },
            message: message
        });
    },
    number: function (message) {
        if (message === void 0) { message = 'Must be a number'; }
        return ({
            validate: function (value) { return !isNaN(value); },
            message: message
        });
    },
    min: function (min, message) {
        if (message === void 0) { message = "Minimum value is ".concat(min); }
        return ({
            validate: function (value) { return value >= min; },
            message: message
        });
    },
    max: function (max, message) {
        if (message === void 0) { message = "Maximum value is ".concat(max); }
        return ({
            validate: function (value) { return value <= max; },
            message: message
        });
    },
    url: function (message) {
        if (message === void 0) { message = 'Invalid URL'; }
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
    },
    custom: function (validateFn, message) { return ({
        validate: validateFn,
        message: message
    }); }
};
