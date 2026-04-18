import { ErrorRequestHandler } from 'express.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
}; 