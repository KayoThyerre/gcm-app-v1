import { Request, Response, NextFunction } from "express";
import type { Role } from "@prisma/client";

export function ensureRole(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "NÃ£o autenticado" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    return next();
  };
}
