/**
 * Send a standardized success response
 */
export function sendSuccess(res, data, statusCode = 200, meta) {
    const response = {
        success: true,
        data,
    };
    if (meta) {
        response.meta = meta;
    }
    return res.status(statusCode).json(response);
}
/**
 * Send a standardized created response
 */
export function sendCreated(res, data) {
    return sendSuccess(res, data, 201);
}
/**
 * Send a standardized no content response
 */
export function sendNoContent(res) {
    return res.status(204).end();
}
//# sourceMappingURL=response.util.js.map