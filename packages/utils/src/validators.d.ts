/**
 * Check if a value is defined (not null or undefined)
 */
export declare function isDefined(value: any): boolean;
/**
 * Check if a string is valid email format
 */
export declare function isValidEmail(email: string): boolean;
/**
 * Check if a string is a valid URL
 */
export declare function isValidUrl(url: string): boolean;
/**
 * Check if an object has all required fields
 */
export declare function hasRequiredFields<T>(obj: T, fields: (keyof T)[]): boolean;
/**
 * Check if a value is a valid UUID
 */
export declare function isValidUuid(uuid: string): boolean;
/**
 * Check if a string is JSON parseable
 */
export declare function isValidJson(str: string): boolean;
//# sourceMappingURL=validators.d.ts.map