const rateLimit = require("express-rate-limit");
const logger = require("../utils/logger");

// Cloudflare passes the real client IP in this header. Better than standard req.ip for Cloudflare.
const getClientIp = (req) => req.headers["cf-connecting-ip"] || req.ip;

// General API Rate Limiter: 100 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  message: { error: "Too many requests, please try again later." },
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for IP: ${getClientIp(req)} on URL: ${req.originalUrl}`);
    res.status(options.statusCode).send(options.message);
  },
});

// Sensitive Auth Limiter (Login/Password): 10 attempts per 30 minutes
const authLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  message: { error: "Too many login attempts, please try again in 30 minutes." },
  handler: (req, res, next, options) => {
    logger.error(`Brute-force attempt suspected for IP: ${getClientIp(req)} on URL: ${req.originalUrl}`);
    res.status(options.statusCode).send(options.message);
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
};
