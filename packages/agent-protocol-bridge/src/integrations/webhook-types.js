"use strict";
/**
 * Webhook System Integration Types
 *
 * Comprehensive type definitions for webhook-based event delivery
 * and integration with The New Fuse AI Agent framework.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookPriority = exports.WebhookDeliveryStatus = exports.WebhookStatus = exports.WebhookRetryBackoff = exports.WebhookAuthentication = exports.WebhookMethod = void 0;
var WebhookMethod;
(function (WebhookMethod) {
    WebhookMethod["GET"] = "GET";
    WebhookMethod["POST"] = "POST";
    WebhookMethod["PUT"] = "PUT";
    WebhookMethod["PATCH"] = "PATCH";
    WebhookMethod["DELETE"] = "DELETE";
})(WebhookMethod || (exports.WebhookMethod = WebhookMethod = {}));
var WebhookAuthentication;
(function (WebhookAuthentication) {
    WebhookAuthentication["NONE"] = "NONE";
    WebhookAuthentication["BEARER_TOKEN"] = "BEARER_TOKEN";
    WebhookAuthentication["BASIC_AUTH"] = "BASIC_AUTH";
    WebhookAuthentication["API_KEY"] = "API_KEY";
    WebhookAuthentication["SIGNATURE"] = "SIGNATURE";
})(WebhookAuthentication || (exports.WebhookAuthentication = WebhookAuthentication = {}));
var WebhookRetryBackoff;
(function (WebhookRetryBackoff) {
    WebhookRetryBackoff["LINEAR"] = "LINEAR";
    WebhookRetryBackoff["EXPONENTIAL"] = "EXPONENTIAL";
    WebhookRetryBackoff["FIXED"] = "FIXED";
})(WebhookRetryBackoff || (exports.WebhookRetryBackoff = WebhookRetryBackoff = {}));
var WebhookStatus;
(function (WebhookStatus) {
    WebhookStatus["ACTIVE"] = "ACTIVE";
    WebhookStatus["INACTIVE"] = "INACTIVE";
    WebhookStatus["ERROR"] = "ERROR";
    WebhookStatus["SUSPENDED"] = "SUSPENDED";
})(WebhookStatus || (exports.WebhookStatus = WebhookStatus = {}));
var WebhookDeliveryStatus;
(function (WebhookDeliveryStatus) {
    WebhookDeliveryStatus["PENDING"] = "PENDING";
    WebhookDeliveryStatus["SENT"] = "SENT";
    WebhookDeliveryStatus["DELIVERED"] = "DELIVERED";
    WebhookDeliveryStatus["FAILED"] = "FAILED";
    WebhookDeliveryStatus["RETRYING"] = "RETRYING";
    WebhookDeliveryStatus["CANCELLED"] = "CANCELLED";
})(WebhookDeliveryStatus || (exports.WebhookDeliveryStatus = WebhookDeliveryStatus = {}));
var WebhookPriority;
(function (WebhookPriority) {
    WebhookPriority["LOW"] = "LOW";
    WebhookPriority["MEDIUM"] = "MEDIUM";
    WebhookPriority["HIGH"] = "HIGH";
    WebhookPriority["URGENT"] = "URGENT";
})(WebhookPriority || (exports.WebhookPriority = WebhookPriority = {}));
//# sourceMappingURL=webhook-types.js.map