import { Router, Request, Response } from "express";
import { prisma } from "../../app.js";
import {
  failed,
  forbidden,
  success,
  unauthorized,
} from "../../utils/response.js";
import { asyncHandler } from "../../middlewares/error_handler.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middlewares/validation.js";
import { deviceSchemas, commonSchemas, schemas } from "../../utils/schemas.js";
import logger from "../../utils/logger.js";

const router = Router();

router.post(
  "/callback",
  asyncHandler(async (req: Request, res: Response) => {
    return success(res, {});
  })
);

export default router;
