import type { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

declare global {
  namespace Express {
    interface Request {
      identityId: string;
    }
  }
}

/*

- This middleware checks for an "X-Identity-ID" header in the incoming request.

  - If it doesn't find one, it generates a new unique identity ID (using a UUID) and sets it in the response header.

  - The identity ID is then attached to the request object for use in subsequent middleware or route handlers.

*/
  
export const identityMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let identityId = req.headers["x-identity-id"] as string;

    if (!identityId) {
      identityId = `guest_${randomUUID()}`;
      res.setHeader("X-Identity-ID", identityId);
    }

    req.identityId = identityId;
    next();
  } catch (error) {
    console.error("Identity middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Identity generation failed",
      data: null,
      errors: [],
    });
  }
};
