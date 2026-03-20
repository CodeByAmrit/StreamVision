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
    }),
  ],
});

if (isProduction) {
  // Production relies on standard stdout pipeline
  // Promtail will scrape Docker container outputs securely mapping them into Loki
  // Removing local 'error.log' reduces container storage bloat significantly.
}

module.exports = logger;
