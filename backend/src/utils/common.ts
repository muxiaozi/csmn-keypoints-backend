import crypto, { BinaryLike } from "node:crypto";

function hmacSHA256(message: BinaryLike, secret: string) {
  return crypto.createHmac("sha256", secret).update(message).digest("hex");
}

function base64(message: any): string {
  return Buffer.from(message).toString("base64");
}

export { hmacSHA256, base64 };
