const { createLogger, format, transports } = require("winston");

const isProduction = process.env.NODE_ENV === "production";

// Define format
const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] ${level}: ${message}`;
  })
);

const logger = createLogger({
  level: "info",
  format: consoleFormat,
  transports: [
    new transports.Console({
      format: consoleFormat,
    })
  ], 
});

if (isProduction) {
  // Only write actual server errors to file in production to keep disk usage extremely small
  logger.add(
    new transports.File({
      filename: "logs/error.log",
      level: "error",
      format: format.combine(format.timestamp(), format.json())
    })
  );
}

module.exports = logger;
