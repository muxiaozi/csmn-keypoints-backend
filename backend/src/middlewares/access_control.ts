import { match } from "path-to-regexp";
import { unauthorized } from "../utils/response.js";

// 角色类型
type Role = "ADMIN" | "USER" | "CLIENT";

// 路由权限配置
interface RoutePermission {
  path: string;
  methods: string[]; // ['GET', 'POST', 'PUT', 'DELETE', etc.]
  allowedRoles: Role[];
}

// 授权信息
interface Auth {
  name: string;
  role: Role;
}

const permissions: RoutePermission[] = [
  {
    path: "/v1/users",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedRoles: ["ADMIN"],
  },
  {
    path: "/v1/licenses",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedRoles: ["ADMIN"],
  },
];

class AccessControl {
  private permissions: RoutePermission[];

  constructor(permissions: RoutePermission[]) {
    this.permissions = permissions;
  }

  /**
   * 检查用户是否有权限访问指定路由
   */
  checkAccess(auth: Auth, path: string, method: string): boolean {
    // 查找匹配的路由权限
    const routePermission = this.permissions.find((permission) => {
      const fn = match(permission.path);
      return fn(path);
    });

    if (!routePermission) {
      // 如果没有配置权限，默认拒绝访问
      return false;
    }

    // 检查方法是否允许
    const methodAllowed = routePermission.methods.includes(
      method.toUpperCase()
    );
    if (!methodAllowed) {
      return false;
    }

    // 检查角色是否允许
    return routePermission.allowedRoles.includes(auth.role);
  }

  /**
   * 创建 Express 中间件
   */
  middleware() {
    return (req: any, res: any, next: any) => {
      const auth = req.auth as Auth;

      if (!auth) {
        return unauthorized(res, "Authentication required");
      }

      const hasAccess = this.checkAccess(auth, req.path, req.method);

      if (!hasAccess) {
        return unauthorized(res, "Forbidden");
      }

      next();
    };
  }
}

export default function accessControlMiddleware() {
  return new AccessControl(permissions).middleware();
}
