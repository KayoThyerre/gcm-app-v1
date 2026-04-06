import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";

type TokenPayload = {
  sub: string;
  role: Role;
};

export function ensureAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  const [, token] = authHeader.split(" ");

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as TokenPayload;

    req.user = {
      id: decoded.sub,
      role: decoded.role,
    };

    return next();
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
}
