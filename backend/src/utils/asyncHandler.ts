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

/* 

A higher-order function is a function that either:

  - Takes one or more functions as arguments, 
  - Returns a function as its result. 


for reference

const asyncHandler = () => {}
const asyncHandler = (func) => {() => {}}
const asyncHandler = (func) => () => {}
const asyncHandler = (func) => async() => {}

const asyncHandler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};


*/
