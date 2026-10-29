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

  // Handle MongoDB connection, network, or buffering timeout errors cleanly
  const errMsg = String(err?.message || '');
  if (
    err?.name === 'MongooseServerSelectionError' ||
    errMsg.includes('buffering timed out') ||
    errMsg.includes('ECONNREFUSED') ||
    errMsg.includes('server selection timed out')
  ) {
    console.error('[CampusFlow DB Connection Error]:', errMsg);
    res.status(503).json({
      success: false,
      error:
        'Database connection unavailable. If deployed on Render, please configure the MONGODB_URI environment variable (pointing to your MongoDB Atlas cluster) and verify Atlas Network Access allows 0.0.0.0/0.',
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
