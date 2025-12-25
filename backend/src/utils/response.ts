import { Response } from "express";
import { AppError } from "./errors.js";

export interface PaginationMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

// 统一的响应结构
export interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data?: T;
  error?: {
    details?: any;
  };
}

// 成功响应结构
export interface SuccessResponse<T = any> extends ApiResponse<T> {
  code: 0; // 0 表示成功
  msg: string;
  data?: T;
}

// 错误响应结构
export interface ErrorResponse extends Omit<ApiResponse, "data"> {
  code: number; // 非0表示失败
  msg: string;
  error: {
    details?: any;
  };
}

export class ApiResponseHandler {
  /**
   * 成功响应
   * @param res Response对象
   * @param data 响应数据
   * @param msg 响应消息
   * @param statusCode HTTP状态码，默认200
   * @returns Response
   */
  static success<T>(
    res: Response,
    data?: T,
    msg: string = "success"
  ): Response {
    const response: SuccessResponse<T> = {
      code: 0,
      msg,
      data,
    };

    return res.status(200).json(response);
  }

  /**
   * 分页响应
   * @param res Response对象
   * @param data 响应数据
   * @param meta 分页信息
   * @param msg 响应消息
   * @returns Response
   */
  static paginated<T>(
    res: Response,
    data: T[],
    meta: PaginationMeta,
    msg: string = "success"
  ): Response {
    const response: Omit<SuccessResponse<T>, "data"> & {
      data: T[];
      meta: PaginationMeta;
    } = {
      code: 0,
      msg,
      data,
      meta,
    };

    return res.status(200).json(response);
  }

  /**
   * 失败响应，HTTP状态码始终为200
   * @param res Response对象
   * @param msg 错误消息
   * @param code 错误码
   * @returns Response
   */
  static failed(
    res: Response,
    msg: string = "failed",
    code: number
  ): Response {
    const response: ApiResponse = {
      code,
      msg,
    };
    return res.status(200).json(response);
  }

  /**
   * 错误响应
   * @param res Response对象
   * @param error 错误对象
   * @returns Response
   */
  static error(res: Response, error: AppError): Response {
    const response: ErrorResponse = {
      code: error.code,
      msg: error.message,
      error: {
        ...(process.env.NODE_ENV === "development" && {
          details: error.stack,
        }),
      },
    };

    return res.status(error.code).json(response);
  }

  // 快捷方法
  static badRequest(res: Response, msg: string = "Bad request"): Response {
    const error = AppError.badRequest(msg);
    return ApiResponseHandler.error(res, error);
  }

  static unauthorized(res: Response, msg: string = "Unauthorized"): Response {
    const error = AppError.unauthorized(msg);
    return ApiResponseHandler.error(res, error);
  }

  static forbidden(res: Response, msg: string = "Forbidden"): Response {
    const error = AppError.forbidden(msg);
    return ApiResponseHandler.error(res, error);
  }

  static internal(
    res: Response,
    msg: string = "Internal server error"
  ): Response {
    const error = AppError.internal(msg);
    return ApiResponseHandler.error(res, error);
  }
}

// 导出简化的响应函数
export const {
  success,
  failed,
  paginated,
  error,
  badRequest,
  unauthorized,
  forbidden,
  internal,
} = ApiResponseHandler;
