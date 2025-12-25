import { Request, Response, NextFunction } from 'express';
import z, { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';

export function validateBody(schema: any) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        throw AppError.badRequest(`Body validation failed: ${z.prettifyError(error)}`);
      }
      next(error);
    }
  };
}

export function validateQuery(schema: any) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        throw AppError.badRequest(`Query validation failed: ${z.prettifyError(error)}`);
      }
      next(error);
    }
  };
}

export function validateParams(schema: any) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        throw AppError.badRequest(`Parameter validation failed: ${z.prettifyError(error)}`);
      }
      next(error);
    }
  };
}