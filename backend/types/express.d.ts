declare module "express-serve-static-core" {
  interface Request {
    auth?: {
      name: string;
      role: "admin" | "user";
      iat: number;
      exp: number;
      iss: string;
    };
  }
}

export {}