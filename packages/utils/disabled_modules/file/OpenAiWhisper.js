"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f)
        throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
        throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _OpenAiWhisper_instances, _OpenAiWhisper_log;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAiWhisper = void 0;
const fs_1 = __importDefault(require("fs"));
const openai_1 = __importDefault(require("openai"));
class OpenAiWhisper {
    constructor({ options }) {
        _OpenAiWhisper_instances.add(this);
        this.model = "whisper-1";
        this.temperature = 0;
        if (!options.openAiKey)
            throw new Error("No OpenAI API key was set.");
        this.openai = new openai_1.default({
            apiKey: options.openAiKey,
        });
        __classPrivateFieldGet(this, _OpenAiWhisper_instances, "m", _OpenAiWhisper_log).call(this, "Initialized.");
    }
}
() => ;
(fullFilePath) => {
    try {
        const response = await this.openai.audio.transcriptions.create({
            file: fs_1.default.createReadStream(fullFilePath),
            model: this.model,
            temperature: this.temperature,
        });
        if (!response) {
            return {
                content: "",
                error: "No content was able to be transcribed.",
            };
        }
        return { content: response.text, error: null };
    }
    catch (error) {
        __classPrivateFieldGet(this, _OpenAiWhisper_instances, "m", _OpenAiWhisper_log).call(this, `Could not get any response from openai whisper`, error.message);
        return { content: "", error: error.message };
    }
};
exports.OpenAiWhisper = OpenAiWhisper;
_OpenAiWhisper_instances = new WeakSet(), _OpenAiWhisper_log = function _OpenAiWhisper_log(text, ...args) {
    
};
export {};
//# sourceMappingURL=OpenAiWhisper.js.map