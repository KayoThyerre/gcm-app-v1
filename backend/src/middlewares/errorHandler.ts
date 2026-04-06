import { Request, Response, NextFunction } from "express";

type AppError = Error & {
  status?: number;
};

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const status = err.status ?? 500;
  const message = err.message || "Internal server error";

  return res.status(status).json({
    error: message,
  });
}
