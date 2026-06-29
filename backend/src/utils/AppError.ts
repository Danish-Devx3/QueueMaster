/**
 * Operational error with an HTTP status code and a machine-readable code.
 * Thrown by services/middleware and translated to a JSON response by the central error handler.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(statusCode: number, message: string, code = 'APP_ERROR') {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    // Restore prototype chain (required when extending built-ins under CommonJS targets).
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message: string, code = 'BAD_REQUEST') {
    return new AppError(400, message, code);
  }

  static notFound(message: string, code = 'NOT_FOUND') {
    return new AppError(404, message, code);
  }
}
