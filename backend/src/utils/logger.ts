import { createLogger, format, transports } from "winston";
import "winston-daily-rotate-file";

const upperCaseLevel = format((info) => {
  info.level = info.level.toUpperCase();
  return info;
});

const logger = createLogger({
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.errors({ stack: true }),
    upperCaseLevel(),
    format.splat()
  ),
  level: "info",
  handleExceptions: true,
  transports: [
    new transports.DailyRotateFile({
      dirname: "logs",
      filename: "app-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxFiles: "14d",
      format: format.json(),
    }),
    new transports.File({
      level: "error",
      filename: "logs/error.log",
      format: format.combine(
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.errors({ stack: true }),
        format.printf((info) => {
          const { stack, timestamp, level, message, ...meta } = info;
          let logMessage = `${timestamp} [${level}] ${message}`;

          // 错误日志必须包含堆栈
          if (stack) {
            logMessage += `\n${stack}`;
          }

          if (Object.keys(meta).length > 0) {
            logMessage += `\n${JSON.stringify(meta, null, 2)}`;
          }

          return logMessage;
        })
      ),
    }),
  ],
});

logger.add(
  new transports.Console({
    format: format.combine(
      format.timestamp({ format: "HH:mm:ss.SSS" }),
      format.errors({ stack: true }),
      format.colorize(),
      format.printf((info) => {
        const { stack, timestamp, level, message, ...meta } = info;
        let logMessage = `${timestamp} [${level}] ${message}`;

        // 在开发环境中显示堆栈
        if (stack && (process.env.NODE_ENV === 'development' || level === 'ERROR')) {
          logMessage += `\n${stack}`;
        }

        // 如果有其他元数据，在开发模式下显示
        if (Object.keys(meta).length > 0 && process.env.NODE_ENV === 'development') {
          // 对于对象类型的元数据，格式化输出
          const metaString = Object.keys(meta).length === 1
            ? JSON.stringify(meta[Object.keys(meta)[0]], null, 2)
            : JSON.stringify(meta, null, 2);

          logMessage += `\n${metaString}`;
        }

        return logMessage;
      })
    ),
  })
);

export default logger;
