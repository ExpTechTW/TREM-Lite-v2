import * as path from "path";
import { app } from "electron";
import * as winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const fileTransport = new DailyRotateFile({
  filename: path.join(app.getPath("logs"), "%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
});

const logger = winston.createLogger({
  level: "info",
  format: winston.format.printf((info: { level: string; message: unknown }) => {
    const date = new Date();
    return `[${formatTwoDigits(date.getHours())}:${formatTwoDigits(date.getMinutes())}:${formatTwoDigits(date.getSeconds())}][${info.level.toUpperCase()}]: ${info.message}`;
  }),
  transports: [new winston.transports.Console(), fileTransport],
});

function formatTwoDigits(num: number): string {
  return num.toString().padStart(2, "0");
}

// Example usage:
logger.info("Logger initialized.");

export { logger };
