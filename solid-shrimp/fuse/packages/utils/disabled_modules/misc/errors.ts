
export {}
exports.getErrors = void 0;
function getErrors(e): any {
    let error;
    if (typeof e === "string") {
        error = e;
    }
    else if (e instanceof Error) {
        error = e.message;
    }
    else {
        error = "Unknown error";
    }
    return error;
}
exports.getErrors = getErrors;
//# sourceMappingURL=errors.js.mapexport {};
