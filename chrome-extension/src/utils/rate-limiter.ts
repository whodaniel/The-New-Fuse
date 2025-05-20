/**
 * Rate limiting utility
 */
export class RateLimiter {
  private maxRequests: number;
  private timeWindow: number;
  private requests: number[];

  /**
   * Create a new RateLimiter
   * @param maxRequests - Maximum number of requests allowed in the time window
   * @param timeWindow - Time window in milliseconds
   */
  constructor(maxRequests: number, timeWindow: number) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
    this.requests = [];
  }

  /**
   * Check if a request can be made
   * @returns Whether a request can be made
   */
  canMakeRequest(): boolean {
    const now = Date.now();
    // Remove expired requests
    this.requests = this.requests.filter(time => now - time < this.timeWindow);

    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }
    return false;
  }

  /**
   * Get time until next request can be made
   * @returns Time in milliseconds until next request can be made
   */
  getTimeToNext(): number {
    if (this.requests.length === 0) return 0;
    return this.timeWindow - (Date.now() - this.requests[0]);
  }
}
