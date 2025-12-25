import express from "express";
import cors from "cors";
import v1Routes from "./routes/v1/index.js";
import dotenv from "dotenv";
import logger from "./utils/logger.js";
import morganMiddleware from "./middlewares/morgan.js";
import {
  globalErrorHandler,
  notFoundHandler,
} from "./middlewares/error_handler.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const app = express();

// Prisma客户端初始化
const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// 请求日志
app.use(morganMiddleware());
// JWT 验证
// app.use(jwtMiddleware());
// 访问控制
// app.use(accessControlMiddleware());
// 允许跨域请求
app.use(cors());
// 解析请求体中的 JSON 数据
app.use(express.json());

// 路由
app.use("/v1", v1Routes);

// 404 处理
app.use(notFoundHandler);

// 全局错误处理 - 必须放在所有路由之后
app.use(globalErrorHandler);

const PORT = process.env.SERVER_PORT || 80;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

export { prisma };
export default app;
