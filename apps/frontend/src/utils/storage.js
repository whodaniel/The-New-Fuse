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
export function getStorage(type) {
    if (type === void 0) { type = 'local'; }
    return type === 'local' ? localStorage : sessionStorage;
}
export function setItem(key, value, options) {
    if (options === void 0) { options = {}; }
    var _a = options.type, type = _a === void 0 ? 'local' : _a, expires = options.expires;
    var storage = getStorage(type);
    var item = __assign({ value: value }, (expires && { expires: Date.now() + expires }));
    try {
        storage.setItem(key, JSON.stringify(item));
    }
    catch (error) {
        console.error('Error saving to storage:', error);
        // Attempt to clear expired items if storage is full
        if (error instanceof Error && error.name === 'QuotaExceededError') {
            clearExpired(type);
            try {
                storage.setItem(key, JSON.stringify(item));
            }
            catch (retryError) {
                console.error('Storage still full after clearing expired items:', retryError);
            }
        }
    }
}
export function getItem(key, options) {
    if (options === void 0) { options = {}; }
    var _a = options.type, type = _a === void 0 ? 'local' : _a;
    var storage = getStorage(type);
    var item = storage.getItem(key);
    if (!item)
        return null;
    try {
        var parsed = JSON.parse(item);
        if (parsed.expires && Date.now() > parsed.expires) {
            storage.removeItem(key);
            return null;
        }
        return parsed.value;
    }
    catch (_b) {
        // If parsing fails, assume it's an old format and return as is
        return item;
    }
}
export function removeItem(key, options) {
    if (options === void 0) { options = {}; }
    var _a = options.type, type = _a === void 0 ? 'local' : _a;
    var storage = getStorage(type);
    storage.removeItem(key);
}
export function clear(type) {
    if (type === void 0) { type = 'local'; }
    var storage = getStorage(type);
    storage.clear();
}
export function clearExpired(type) {
    if (type === void 0) { type = 'local'; }
    var storage = getStorage(type);
    var now = Date.now();
    Object.keys(storage).forEach(function (key) {
        var item = storage.getItem(key);
        if (item) {
            try {
                var parsed = JSON.parse(item);
                if (parsed.expires && now > parsed.expires) {
                    storage.removeItem(key);
                }
            }
            catch (_a) {
                // Skip if item can't be parsed
            }
        }
    });
}
export function getSize(type) {
    if (type === void 0) { type = 'local'; }
    var storage = getStorage(type);
    return Object.keys(storage).reduce(function (size, key) {
        var item = storage.getItem(key);
        return size + (item ? item.length : 0);
    }, 0);
}
export function hasSupport(type) {
    if (type === void 0) { type = 'local'; }
    try {
        var storage = getStorage(type);
        var testKey = '__storage_test__';
        storage.setItem(testKey, '');
        storage.removeItem(testKey);
        return true;
    }
    catch (_a) {
        return false;
    }
}
export function subscribe(key, callback, options) {
    if (options === void 0) { options = {}; }
    var _a = options.type, type = _a === void 0 ? 'local' : _a;
    var handleStorage = function (event) {
        if (event.key === key && event.storageArea === getStorage(type)) {
            var newValue = event.newValue ? JSON.parse(event.newValue).value : null;
            callback(newValue);
        }
    };
    window.addEventListener('storage', handleStorage);
    return function () { return window.removeEventListener('storage', handleStorage); };
}
