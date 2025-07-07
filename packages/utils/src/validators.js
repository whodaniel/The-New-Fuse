"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDefined = isDefined;
exports.isValidEmail = isValidEmail;
exports.isValidUrl = isValidUrl;
exports.hasRequiredFields = hasRequiredFields;
exports.isValidUuid = isValidUuid;
exports.isValidJson = isValidJson;
/**
 * Check if a value is defined (not null or undefined)
 */
function isDefined(value) {
    return value !== null && value !== undefined;
}
/**
 * Check if a string is valid email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
/**
 * Check if a string is a valid URL
 */
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    }
    catch (error) {
        return false;
    }
}
/**
 * Check if an object has all required fields
 */
function hasRequiredFields(obj, fields) {
    return fields.every(field => isDefined(obj[field]));
}
/**
 * Check if a value is a valid UUID
 */
function isValidUuid(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}
/**
 * Check if a string is JSON parseable
 */
function isValidJson(str) {
    try {
        JSON.parse(str);
        return true;
    }
    catch (error) {
        return false;
    }
}
