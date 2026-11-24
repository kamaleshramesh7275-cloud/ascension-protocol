import { Request, Response, NextFunction } from "express";

export async function extractFirebaseUid(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // SEC-01/02 CONTRACT:
  // Raw 'x-firebase-uid' headers are strictly ignored to prevent account impersonation and spoofing.
  // Identity is cryptographically verified from Bearer tokens in requireAuth middleware.
  next();
}
