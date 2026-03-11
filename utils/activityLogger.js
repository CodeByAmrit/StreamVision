const db = require("../config/db");
const logger = require("./logger");

/**
 * Logs an action to the recent activity tracking table.
 * 
 * @param {string} type - 'dvr', 'camera', 'system', 'security', etc.
 * @param {string} action - 'added', 'updated', 'deleted', 'login_fail', 'config_change'
 * @param {string} description - Human readable sentence of what happened
 * @param {string} ip - (Optional) IP address of the requester
 */
async function logActivity(type, action, description, ip = null) {
  try {
    const finalDescription = ip ? `[IP: ${ip}] ${description}` : description;
    // Truncate to 255 to fit DB schema
    const truncatedDescription = finalDescription.substring(0, 255);

    await db.execute(
      `INSERT INTO activity_logs (source_type, action, description) VALUES (?, ?, ?)`,
      [type, action, truncatedDescription]
    );
  } catch (error) {
    logger.error("Failed to insert into activity_logs:", error);
  }
}

/**
 * Gets the most recent activities.
 * 
 * @param {number} limit - Number of logs to fetch
 * @returns {Array} List of recent activities
 */
async function getRecentActivities(limit = 5) {
  try {
    const parsedLimit = parseInt(limit) || 5;
    const [rows] = await db.execute(
      `SELECT source_type, action, description, created_at 
       FROM activity_logs 
       ORDER BY created_at DESC 
       LIMIT ${parsedLimit}`
    );
    return rows;
  } catch (error) {
    logger.error("Failed to fetch activity_logs:", error);
    return [];
  }
}

module.exports = {
  logActivity,
  getRecentActivities
};
