import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "./error.middleware.js";
import type { AuthTokenPayload, UserRole } from "@tms/contracts";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw new HttpError(401, "Missing authorization token");
    }
    const payload = verifyToken(header.slice(7));
    const user = await prisma.user.findUnique({
      where: { userId: payload.userId },
    });
    if (!user || user.status !== "ACTIVE") {
      throw new HttpError(401, "Account is inactive or no longer exists");
    }
    req.user = { userId: user.userId, role: user.role as UserRole };
    next();
  } catch (err) {
    if (err instanceof HttpError) {
      next(err);
      return;
    }
    next(new HttpError(401, "Invalid or expired token"));
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new HttpError(401, "Not authenticated"));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new HttpError(403, "You do not have permission to perform this action"));
      return;
    }
    next();
  };
}
