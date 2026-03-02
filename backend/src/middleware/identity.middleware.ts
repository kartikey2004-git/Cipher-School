import type { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

declare global {
  namespace Express {
    interface Request {
      identityId: string;
    }
  }
}

const isValidIdentityId = (id: string): boolean => {
  if (!id || typeof id !== "string") return false;
  if (id.length > 128) return false;
  return /^[a-zA-Z0-9_\-]+$/.test(id);
};

export const identityMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let identityId = req.headers["x-identity-id"] as string;

    if (!identityId || !isValidIdentityId(identityId)) {
      identityId = `guest_${randomUUID()}`;
      res.setHeader("X-Identity-ID", identityId);
    }

    req.identityId = identityId;
    next();
  } catch (error) {
    console.error("Identity middleware error:", error);
    res.status(500).json({
      success: false,
      data: null,
      error: "Identity generation failed",
      message: "Identity generation failed",
    });
  }
};

export { isValidIdentityId };
