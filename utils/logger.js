const { createLogger, format, transports } = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");

const isProduction = process.env.NODE_ENV === "production";

// Define different formats for development and production
const devFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] ${level}: ${message}`;
  })
);

const prodFormat = format.combine(format.timestamp(), format.json());

const logger = createLogger({
  level: "info",
  format: isProduction ? prodFormat : devFormat,
  transports: [], // We will add transports based on environment
});

if (isProduction) {
  // Production transports
  logger.add(
    new DailyRotateFile({
      filename: "logs/app-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxFiles: "14d",
      level: "info",
    })
  );
  logger.add(
    new transports.File({
      filename: "logs/error.log",
      level: "error",
    })
  );
} else {
  // Development transport
  logger.add(
    new transports.Console({
      format: devFormat,
    })
  );
}

module.exports = logger;
