import { expressjwt } from "express-jwt";

const excludePaths = [
  "/v1/login",
  "/v1/refresh-token",
];

export default function jwtMiddleware() {
  // JWT 验证中间件
  return expressjwt({
    secret: process.env.JWT_ACCESS_SECRET!,
    algorithms: ["HS256"],
  }).unless({ path: excludePaths, custom: (req) => {
    return false;
  } });
}
