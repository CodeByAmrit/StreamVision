// utils/logger.js
const { createLogger, format, transports } = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");

const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp(),
    format.json()
  ),

  transports: [
    // Save logs by date
    new DailyRotateFile({
      filename: "logs/app-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxFiles: "14d"
    }),

    // Print errors to console
    new transports.Console({
      format: format.combine(format.colorize(), format.simple())
    })
  ],
});

module.exports = logger;
