"use strict";
/**
 * Common Test Helpers
 *
 * Shared utilities for testing across the monorepo.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitFor = waitFor;
exports.sleep = sleep;
exports.mockFn = mockFn;
exports.flushPromises = flushPromises;
exports.createDeferred = createDeferred;
exports.randomString = randomString;
exports.randomEmail = randomEmail;
exports.randomUUID = randomUUID;
exports.createSpyObj = createSpyObj;
exports.expectThrowsAsync = expectThrowsAsync;
exports.suppressConsole = suppressConsole;
exports.mockDate = mockDate;
/**
 * Wait for a condition to be true
 */
async function waitFor(condition, options = {}) {
    const { timeout = 5000, interval = 100 } = options;
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        if (await condition()) {
            return;
        }
        await sleep(interval);
    }
    throw new Error('Timeout waiting for condition');
}
/**
 * Sleep for a specified duration
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Create a mock function with TypeScript support
 */
function mockFn() {
    return jest.fn();
}
/**
 * Flush all pending promises
 */
async function flushPromises() {
    return new Promise(resolve => setImmediate(resolve));
}
function createDeferred() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}
/**
 * Generate a random string
 */
function randomString(length = 10) {
    return Math.random().toString(36).substring(2, length + 2);
}
/**
 * Generate a random email
 */
function randomEmail() {
    return `test-${randomString()}@example.com`;
}
/**
 * Generate a random UUID (simple version)
 */
function randomUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
/**
 * Create a spy object with all methods as jest.Mock
 */
function createSpyObj(baseName, methodNames) {
    const obj = {};
    methodNames.forEach((methodName) => {
        obj[methodName] = jest.fn().mockName(`${baseName}.${String(methodName)}`);
    });
    return obj;
}
/**
 * Assert that a function throws an error
 */
async function expectThrowsAsync(fn, errorMessageOrType) {
    let didThrow = false;
    let error;
    try {
        await fn();
    }
    catch (e) {
        didThrow = true;
        error = e;
    }
    if (!didThrow) {
        throw new Error('Expected function to throw an error');
    }
    if (errorMessageOrType) {
        if (typeof errorMessageOrType === 'string') {
            if (!error.message.includes(errorMessageOrType)) {
                throw new Error(`Expected error message to include "${errorMessageOrType}", but got "${error.message}"`);
            }
        }
        else if (errorMessageOrType instanceof RegExp) {
            if (!errorMessageOrType.test(error.message)) {
                throw new Error(`Expected error message to match ${errorMessageOrType}, but got "${error.message}"`);
            }
        }
        else {
            if (!(error instanceof errorMessageOrType)) {
                throw new Error(`Expected error to be instance of ${errorMessageOrType.name}, but got ${error.constructor.name}`);
            }
        }
    }
}
/**
 * Suppress console output during test
 */
function suppressConsole(methods = ['log', 'warn', 'error', 'info']) {
    const originalMethods = {};
    methods.forEach((method) => {
        originalMethods[method] = console[method];
        console[method] = jest.fn();
    });
    return () => {
        methods.forEach((method) => {
            console[method] = originalMethods[method];
        });
    };
}
/**
 * Create a mock date
 */
function mockDate(date) {
    const RealDate = Date;
    const fixedDate = new RealDate(date);
    global.Date = class extends RealDate {
        constructor(...args) {
            if (args.length === 0) {
                super(fixedDate.getTime());
            }
            else if (args.length === 1) {
                // Avoid spread to satisfy TS5+ tuple constraint
                super(args[0]);
            }
            else {
                // Fallback
                super(fixedDate.getTime());
            }
        }
        static now() {
            return fixedDate.getTime();
        }
    };
    return () => {
        global.Date = RealDate;
    };
}
//# sourceMappingURL=test-helpers.js.map