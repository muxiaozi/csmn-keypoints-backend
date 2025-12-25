import { Response } from "express";
import { ApiResponseHandler } from "./response.js";

export class AppError extends Error {
  public readonly code: number;

  constructor(code: number, message: string) {
    super(message);
    this.code = code;

    // 确保错误堆栈正确显示
    Error.captureStackTrace(this, this.constructor);
  }

  // 快捷创建方法
  static badRequest(message: string): AppError {
    return new AppError(400, message);
  }

  static unauthorized(message: string): AppError {
    return new AppError(401, message);
  }

  static forbidden(message: string): AppError {
    return new AppError(403, message);
  }

  static internal(message: string): AppError {
    return new AppError(500, message);
  }

  // 发送错误响应（现在使用 ApiResponseHandler）
  send(res: Response): Response {
    return ApiResponseHandler.error(res, this);
  }
}

// 处理 Prisma 错误的工具函数
export function handlePrismaError(error: any): AppError {
  switch (error.code) {
    case "P2002":
      return new AppError(
        409,
        `Unique constraint failed on field: ${error.meta?.target}`
      );
    case "P2025":
      return new AppError(404, "Record not found");
    case "P2003":
      return new AppError(400, "Foreign key constraint violation");
    case "P2014":
      return new AppError(400, "Invalid relation change");
    default:
      return new AppError(500, `Database error: ${error.message}`);
  }
}
