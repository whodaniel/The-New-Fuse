/**
 * Video Provider Interface
 *
 * Abstract interface for video diffusion model providers.
 * Implement this interface to add support for new video generation services.
 */
/**
 * Base class for video providers with common functionality
 */
export class BaseVideoProvider {
    constructor(config) {
        this.apiKey = config.apiKey;
        this.baseUrl = config.baseUrl || this.getDefaultBaseUrl();
        this.timeoutMs = config.timeoutMs || 300000; // 5 minutes default
        this.maxRetries = config.maxRetries || 3;
    }
    async isAvailable() {
        try {
            return await this.validateCredentials();
        }
        catch {
            return false;
        }
    }
    async downloadVideo(videoUrl, outputPath) {
        const fs = await import('fs');
        const path = await import('path');
        const response = await fetch(videoUrl);
        if (!response.ok) {
            throw new Error(`Failed to download video: ${response.status} ${response.statusText}`);
        }
        const buffer = await response.arrayBuffer();
        // Ensure directory exists
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(outputPath, Buffer.from(buffer));
        return outputPath;
    }
    /**
     * Helper method for making authenticated API requests
     */
    async apiRequest(endpoint, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
        const headers = new Headers(options.headers);
        headers.set('Content-Type', 'application/json');
        this.setAuthHeader(headers);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            const response = await fetch(url, {
                ...options,
                headers,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorBody}`);
            }
            return await response.json();
        }
        catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }
    /**
     * Set authentication header (override in subclasses for different auth methods)
     */
    setAuthHeader(headers) {
        headers.set('Authorization', `Bearer ${this.apiKey}`);
    }
    /**
     * Generate a unique job ID
     */
    generateJobId() {
        return `${this.name}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    /**
     * Poll for job completion
     */
    async waitForCompletion(jobId, options = {}) {
        const { pollIntervalMs = 5000, maxWaitMs = 600000, // 10 minutes
        onProgress, } = options;
        const startTime = Date.now();
        while (true) {
            const job = await this.getJobStatus(jobId);
            if (onProgress) {
                onProgress(job);
            }
            if (job.status === 'completed' && job.result) {
                return job.result;
            }
            if (job.status === 'failed') {
                throw new Error(job.error?.message || 'Video generation failed');
            }
            if (job.status === 'cancelled') {
                throw new Error('Video generation was cancelled');
            }
            if (Date.now() - startTime > maxWaitMs) {
                throw new Error('Video generation timed out');
            }
            await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
        }
    }
}
//# sourceMappingURL=IVideoProvider.js.map