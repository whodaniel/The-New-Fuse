export class BaseError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class AuthError extends BaseError {
  constructor(message = "Authentication error", statusCode = 401) {
    super(message, statusCode);
  }
}

export class FileUploadError extends BaseError {
  constructor(message = "File upload error", statusCode = 400) {
    super(message, statusCode);
  }
}
