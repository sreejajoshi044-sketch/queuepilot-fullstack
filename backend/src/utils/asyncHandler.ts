
import type {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from "express";

// Type for an asynchronous Express controller
type AsyncController = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

// Wrap asynchronous controllers to forward errors
export const asyncHandler = (
  controller: AsyncController
): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(controller(req, res, next)).catch(next);
  };
};
