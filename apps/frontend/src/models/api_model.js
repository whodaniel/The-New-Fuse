var ApiErrorFactory = /** @class */ (function () {
    function ApiErrorFactory() {
    }
    ApiErrorFactory.create = function (message, code, details, statusCode) {
        var error = new Error(message);
        error.code = code;
        error.details = details;
        error.statusCode = statusCode;
        return error;
    };
    return ApiErrorFactory;
}());
export { ApiErrorFactory };
