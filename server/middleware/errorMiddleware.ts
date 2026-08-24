import { Request, Response, NextFunction } from 'express';

export function errorMiddleware(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('Unhandled Server Error:', err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error occurred. Please try again later.';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
