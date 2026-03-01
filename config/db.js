const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
};

if (isProduction) {
  if (!process.env.DB_CA) {
    throw new Error("DB_CA is required in production environment");
  }

  const caContent = Buffer.from(process.env.DB_CA, "base64").toString("utf8");

  dbConfig.ssl = {
    ca: caContent,
  };

  console.log("✅ MySQL running with SSL (Production Mode)");
} else {
  console.log("🛠 MySQL running without SSL (Development Mode)");
}

const pool = mysql.createPool(dbConfig);

module.exports = pool;