import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "ai-prep-kit-jwt-secret-key-2026";

export interface AuthenticatedRequest extends Request {
  user?: { userId: string; email: string };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing authentication token" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }
}
