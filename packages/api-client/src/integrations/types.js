/**
 * Integration types
 */
export var IntegrationType;
(function (IntegrationType) {
    IntegrationType["AUTOMATION"] = "automation";
    IntegrationType["CRM"] = "crm";
    IntegrationType["ECOMMERCE"] = "ecommerce";
    IntegrationType["SOCIAL_MEDIA"] = "social_media";
    IntegrationType["AI"] = "ai";
    // Add other types as needed
})(IntegrationType || (IntegrationType = {}));
/**
 * Authentication types for integrations
 */
export var AuthType;
(function (AuthType) {
    AuthType["API_KEY"] = "api_key";
    AuthType["OAUTH1"] = "oauth1";
    AuthType["OAUTH2"] = "oauth2";
    AuthType["BASIC"] = "basic";
    AuthType["CUSTOM"] = "custom";
    AuthType["NONE"] = "none";
})(AuthType || (AuthType = {}));
//# sourceMappingURL=types.js.map