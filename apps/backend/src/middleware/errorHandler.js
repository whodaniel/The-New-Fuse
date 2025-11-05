"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, _req, res, _next) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map