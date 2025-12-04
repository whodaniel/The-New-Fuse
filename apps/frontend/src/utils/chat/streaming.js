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
export function handleChatStream(response_1) {
    return __awaiter(this, arguments, void 0, function (response, options) {
        var onChunk, onError, onComplete, signal, reader, decoder, buffer, _a, value, done, chunk_1, chunk, newlineIndex, message, parsed, e_1, error_1;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    onChunk = options.onChunk, onError = options.onError, onComplete = options.onComplete, signal = options.signal;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 14, , 15]);
                    if (!response.body) {
                        throw new Error('No response body');
                    }
                    reader = response.body.getReader();
                    decoder = new TextDecoder();
                    buffer = '';
                    _b.label = 2;
                case 2:
                    if (!true) return [3 /*break*/, 13];
                    if (!(signal === null || signal === void 0 ? void 0 : signal.aborted)) return [3 /*break*/, 4];
                    return [4 /*yield*/, reader.cancel()];
                case 3:
                    _b.sent();
                    return [3 /*break*/, 13];
                case 4: return [4 /*yield*/, reader.read()];
                case 5:
                    _a = _b.sent(), value = _a.value, done = _a.done;
                    if (done) {
                        // Process any remaining buffer content
                        if (buffer) {
                            try {
                                chunk_1 = JSON.parse(buffer);
                                onChunk === null || onChunk === void 0 ? void 0 : onChunk(chunk_1);
                            }
                            catch (e) {
                                console.warn('Failed to parse remaining buffer:', e);
                            }
                        }
                        return [3 /*break*/, 13];
                    }
                    chunk = decoder.decode(value, { stream: true });
                    buffer += chunk;
                    newlineIndex = void 0;
                    _b.label = 6;
                case 6:
                    if (!((newlineIndex = buffer.indexOf('\n')) !== -1)) return [3 /*break*/, 12];
                    message = buffer.slice(0, newlineIndex);
                    buffer = buffer.slice(newlineIndex + 1);
                    if (!message.trim()) return [3 /*break*/, 11];
                    _b.label = 7;
                case 7:
                    _b.trys.push([7, 10, , 11]);
                    parsed = JSON.parse(message);
                    onChunk === null || onChunk === void 0 ? void 0 : onChunk(parsed);
                    if (!parsed.done) return [3 /*break*/, 9];
                    return [4 /*yield*/, reader.cancel()];
                case 8:
                    _b.sent();
                    onComplete === null || onComplete === void 0 ? void 0 : onComplete();
                    return [2 /*return*/];
                case 9: return [3 /*break*/, 11];
                case 10:
                    e_1 = _b.sent();
                    console.warn('Failed to parse message:', e_1);
                    return [3 /*break*/, 11];
                case 11: return [3 /*break*/, 6];
                case 12: return [3 /*break*/, 2];
                case 13:
                    onComplete === null || onComplete === void 0 ? void 0 : onComplete();
                    return [3 /*break*/, 15];
                case 14:
                    error_1 = _b.sent();
                    if (error_1 instanceof Error) {
                        onError === null || onError === void 0 ? void 0 : onError(error_1);
                    }
                    else {
                        onError === null || onError === void 0 ? void 0 : onError(new Error('Unknown streaming error'));
                    }
                    return [3 /*break*/, 15];
                case 15: return [2 /*return*/];
            }
        });
    });
}
export function createAbortController() {
    return new AbortController();
}
export function isStreamingSupported() {
    return !!(typeof ReadableStream === 'function' &&
        typeof TextDecoder === 'function');
}
