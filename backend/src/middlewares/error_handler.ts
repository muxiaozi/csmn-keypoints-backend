import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger.js";
import { AppError, handlePrismaError } from "../utils/errors.js";

export function globalErrorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // 记录错误日志
  logger.error("Error occurred:", {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    timestamp: new Date().toISOString(),
  });

  // 如果是我们的自定义错误，直接发送
  if (error instanceof AppError) {
    error.send(res);
    return;
  }

  // 处理 JWT 错误
  if (error.name === "UnauthorizedError") {
    const unauthorizedError = new AppError(
      401,
      "Invalid or missing authentication token"
    );
    unauthorizedError.send(res);
    return;
  }

  // 处理 Prisma 错误
  if (error.name === "PrismaClientKnownRequestError") {
    const prismaError = handlePrismaError(error);
    prismaError.send(res);
    return;
  }

  // 处理 JSON 解析错误
  if (error instanceof SyntaxError && "body" in error) {
    const jsonError = new AppError(400, "Invalid JSON in request body");
    jsonError.send(res);
    return;
  }

  // 处理验证错误（如果你使用 Joi 或 Zod）
  if (error.name === "ValidationError") {
    const validationError = new AppError(400, "Validation failed");
    validationError.send(res);
    return;
  }

  // 处理未知错误
  const internalError = new AppError(
    500,
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : error.message || "Unknown error occurred"
  );
  internalError.send(res);
}

// 异步错误捕获包装器
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 404 处理中间件
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const error = new AppError(404, `Route ${req.method} ${req.path} not found`);
  next(error);
}
