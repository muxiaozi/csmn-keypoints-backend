import morgan from "morgan";
import logger from "../utils/logger.js";

export default function morganMiddleware() {
  return [
    morgan("combined", {
      skip: (req, res) => res.statusCode >= 400,
      stream: { write: (message) => logger.info(message.trim()) },
    }),
    morgan("combined", {
      skip: (req, res) => res.statusCode < 400,
      stream: { write: (message) => logger.error(message.trim()) },
    }),
  ];
}
