// functions/utils/errors.js
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}
class BadRequestError extends AppError {
  constructor(msg) { super(msg, 400); }
}
class ForbiddenError extends AppError {
  constructor(msg) { super(msg, 403); }
}
class NotFoundError extends AppError {
  constructor(msg) { super(msg, 404); }
}

module.exports = { AppError, BadRequestError, ForbiddenError, NotFoundError };
