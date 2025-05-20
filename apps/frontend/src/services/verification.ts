import axios from 'axios';
export class VerificationService {
    constructor() {
        this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    }
    static getInstance() {
        if (!VerificationService.instance) {
            VerificationService.instance = new VerificationService();
        }
        return VerificationService.instance;
    }
    async verifyEmail(token) {
        try {
            const response = await axios.post(`${this.baseUrl}/auth/verify-email`, { token });
            return response.data;
        }
        catch (error) {
            throw new Error('Email verification failed');
        }
    }
    async resendVerification(email) {
        try {
            const response = await axios.post(`${this.baseUrl}/auth/resend-verification`, { email });
            return response.data;
        }
        catch (error) {
            throw new Error('Failed to resend verification email');
        }
    }
    async verify2FA(code, token) {
        try {
            const response = await axios.post(`${this.baseUrl}/auth/verify-2fa`, { code }, { headers: { Authorization: `Bearer ${token}` } });
            return response.data;
        }
        catch (error) {
            throw new Error('2FA verification failed');
        }
    }
}
//# sourceMappingURL=verification.js.map