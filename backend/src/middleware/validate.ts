import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../types/index';

type ValidationTarget = 'body' | 'query' | 'params';

export function validate(
  schema: ZodSchema,
  target: ValidationTarget = 'body',
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = schema.parse(req[target]);
      // Replace with parsed (and transformed) data
      if (target === 'body') {
        req.body = data;
      } else if (target === 'query' || target === 'params') {
        // Express 5: req.query and req.params are read-only getters
        // Store parsed data on a custom property instead
        (req as unknown as Record<string, unknown>)[`_parsed_${target}`] = data;
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details: Record<string, string[]> = {};
        for (const issue of err.issues) {
          const path = issue.path.join('.') || '_root';
          if (!details[path]) {
            details[path] = [];
          }
          details[path].push(issue.message);
        }

        next(
          new AppError(
            400,
            'INVALID_INPUT',
            'Validation failed',
            details,
          ),
        );
        return;
      }
      next(err);
    }
  };
}
