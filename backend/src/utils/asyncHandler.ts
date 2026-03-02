import type { NextFunction, Request, Response } from "express";

const asyncHandler = (
  requestHandlerfn: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(requestHandlerfn(req, res, next)).catch((error) => {
      next(error);
    });
  };
};

export { asyncHandler };
