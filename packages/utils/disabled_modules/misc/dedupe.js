"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Deduplicator = void 0;
const crypto_1 = __importDefault(require("crypto"));
const DEFAULT_COOLDOWN_MS = 5 * 1000;
class Deduplicator {
    constructor() {
        this.hashes = {};
        this.cooldowns = {};
        this.uniques = {};
    }
    trackRun(key, params = {}) {
        const hash = crypto_1.default.createHash('sha256').update(JSON.stringify({ key, params })).digest('hex');
        this.hashes[hash] = Number(new Date());
    }
    isDuplicate(key, params = {}) {
        const newSig = crypto_1.default
            .createHash('sha256')
            .update(JSON.stringify({ key, params }))
            .digest('hex');
        return this.hashes.hasOwnProperty(newSig);
    }
    /**
     * Resets the object property for this instance of the Deduplicator class
     * @param {('runs'|'cooldowns'|'uniques')} type - The type of prop to reset
     */
    reset(type = 'runs') {
        switch (type) {
            case 'runs':
                this.hashes = {};
                break;
            case 'cooldowns':
                this.cooldowns = {};
                break;
            case 'uniques':
                this.uniques = {};
                break;
        }
        return;
    }
    startCooldown(key, parameters = { cooldownInMs: DEFAULT_COOLDOWN_MS }) {
        this.cooldowns[key] = Number(new Date()) + Number(parameters.cooldownInMs);
    }
    isOnCooldown(key) {
        if (!this.cooldowns.hasOwnProperty(key))
            return false;
        return Number(new Date()) <= this.cooldowns[key];
    }
    isUnique(key) {
        return !this.uniques.hasOwnProperty(key);
    }
    removeUniqueConstraint(key) {
        delete this.uniques[key];
    }
    markUnique(key) {
        this.uniques[key] = Number(new Date());
    }
}
exports.Deduplicator = Deduplicator;
export {};
//# sourceMappingURL=dedupe.js.map