import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type Target = 'body' | 'query' | 'params';

/**
 * Returns an Express middleware that validates req[target] against the schema.
 * On failure, responds with 400 and structured field errors.
 * On success, replaces req[target] with the parsed (coerced) value.
 */
export function validate(schema: ZodSchema, target: Target = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      res.status(400).json({
        data: null,
        error: 'Validation failed.',
        fieldErrors: result.error.flatten().fieldErrors,
      });
      return;
    }

    (req as any)[target] = result.data;
    next();
  };
}
