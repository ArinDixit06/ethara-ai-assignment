import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      console.error('[VALIDATION FAILED] Path:', req.path, 'Errors:', JSON.stringify(result.error.flatten().fieldErrors, null, 2));
      res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.flatten().fieldErrors
      });
      return;
    }
    // Assign validated and parsed data back to req.body
    req.body = result.data;
    next();
  };
};

export default validate;
