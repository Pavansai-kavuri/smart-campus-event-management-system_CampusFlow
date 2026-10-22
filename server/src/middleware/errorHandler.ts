import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Handle MongoDB duplicate key errors cleanly
  if (err && err.code === 11000) {
    res.status(409).json({
      success: false,
      error: 'Duplicate record detected. This action has already been recorded.',
    });
    return;
  }

  const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
  const message =
    statusCode < 500
      ? err.message
      : 'An unexpected server error occurred. Please try again.';

  if (statusCode >= 500) {
    console.error('[CampusFlow Server Error]:', err?.message || err);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}
