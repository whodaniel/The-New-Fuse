"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEmail = exports.generateNumber = exports.generateBoolean = exports.generateTimestamp = exports.generateId = void 0;
exports.pickRandom = pickRandom;
exports.generateEnum = generateEnum;
exports.generateArray = generateArray;
exports.generateObject = generateObject;
const generateId = (prefix = '') => {
    return `${prefix}${Math.random().toString(36).substring(2, 11)}`;
};
exports.generateId = generateId;
const generateTimestamp = (options = {}) => {
    const now = new Date();
    const daysRange = options.daysRange || 30;
    if (options.past) {
        const pastDate = new Date(now);
        pastDate.setDate(now.getDate() - Math.floor(Math.random() * daysRange));
        return pastDate;
    }
    if (options.future) {
        const futureDate = new Date(now);
        futureDate.setDate(now.getDate() + Math.floor(Math.random() * daysRange));
        return futureDate;
    }
    return now;
};
exports.generateTimestamp = generateTimestamp;
function pickRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
}
function generateEnum(values) {
    return pickRandom(values);
}
const generateBoolean = (likelihood = 0.5) => {
    return Math.random() < likelihood;
};
exports.generateBoolean = generateBoolean;
const generateNumber = (min = 0, max = 100) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
exports.generateNumber = generateNumber;
function generateArray(generator, length = 3) {
    return Array.from({ length }, () => generator());
}
function generateObject(template) {
    const result = {};
    for (const [key, value] of Object.entries(template)) {
        if (typeof value === 'function') {
            result[key] = value();
        }
        else {
            result[key] = value;
        }
    }
    return result;
}
const generateEmail = (username) => {
    const domains = ['example.com', 'test.com', 'fakemail.com'];
    return `${username.toLowerCase().replace(/\s+/g, '.')}@${pickRandom(domains)}`;
};
exports.generateEmail = generateEmail;
//# sourceMappingURL=utils.js.map