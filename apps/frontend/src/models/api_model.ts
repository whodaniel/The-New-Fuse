export class ApiErrorFactory {
    static create(message, code, details, statusCode) {
        const error = new Error(message);
        error.code = code;
        error.details = details;
        error.statusCode = statusCode;
        return error;
    }
}
//# sourceMappingURL=api_model.js.map