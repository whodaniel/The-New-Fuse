import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';

// Create simple validation error
class ValidationError extends Error {
  statusCode: number;
  details: any[];
  
  constructor(message: string, details: any[]) {
    super(message);
    this.statusCode = 400;
    this.details = details;
  }
}

export const validateRequest = (schema: Schema): any => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      throw new ValidationError('Validation error', 
        error.details.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      );
    }

    next();
  };
};