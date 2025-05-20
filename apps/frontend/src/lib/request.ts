export function userFromStorage(): any {
    try {
        const userString = window.localStorage.getItem(AUTH_USER);
        if (!userString)
            return null;
        return JSON.parse(userString);
    }
    catch (_a) { }
    return {};
}
export function baseHeaders(providedToken = null): any {
    const token = providedToken || window.localStorage.getItem(AUTH_TOKEN);
    return {
        Authorization: token ? `Bearer ${token}` : null,
    };
}
export function safeJsonParse(jsonString, fallback = null): any {
    try {
        return JSON.parse(jsonString);
    }
    catch (_a) { }
    return fallback;
}
//# sourceMappingURL=request.js.map