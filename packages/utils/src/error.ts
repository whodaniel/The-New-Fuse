
export {}
exports.AIError = void 0;
class AIError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AIError';
    }
}
exports.AIError = AIError;
//# sourceMappingURL=error.js.mapexport {};
