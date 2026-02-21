/**
 * Custom WebSocket error class for handling WebSocket-specific errors
 */
export class WebSocketError extends Error {
  public readonly code: number;
  public readonly timestamp: Date;

  constructor(message: string, code: number = 500) {
    super(message);
    this.name = 'WebSocketError';
    this.code = code;
    this.timestamp = new Date();
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WebSocketError);
    }
  }

  /**
   * Creates a formatted error object for client transmission
   */
  toClientError() {
    return {
      error: true,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp.toISOString()
    };
  }

  /**
   * Static method to create common error types
   */
  static connectionFailed(reason?: string): WebSocketError {
    return new WebSocketError(
      `Connection failed${reason ? `: ${reason}` : ''}`,
      1006
    );
  }

  static authenticationFailed(): WebSocketError {
    return new WebSocketError('Authentication failed', 4001);
  }

  static rateLimitExceeded(): WebSocketError {
    return new WebSocketError('Rate limit exceeded', 4002);
  }

  static invalidMessage(details?: string): WebSocketError {
    return new WebSocketError(
      `Invalid message format${details ? `: ${details}` : ''}`,
      4003
    );
  }

  static serverOverloaded(): WebSocketError {
    return new WebSocketError('Server is overloaded', 4004);
  }
}