export class ApiClient {
    static async call(options) {
        const { endpoint, method = 'GET', body, headers = {}, token } = options;
        try {
            const requestHeaders = Object.assign(Object.assign({ 'Content-Type': 'application/json' }, headers), (token ? { 'Authorization': `Bearer ${token}` } : {}));
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method,
                headers: requestHeaders,
                body: body ? JSON.stringify(body) : undefined,
            });
            const data = await response.json();
            if (!response.ok) {
                throw { message: data.message || 'An error occurred', status: response.status };
            }
            return data;
        }
        catch (error) {
            throw {
                message: error.message || 'An unknown error occurred',
                status: error.status,
            };
        }
    }
}
//# sourceMappingURL=api-client.js.map