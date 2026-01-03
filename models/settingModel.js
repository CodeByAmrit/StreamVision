const db = require("../config/db");

const Setting = {
  async getAll() {
    const [rows] = await db.query("SELECT * FROM settings");
    return rows.reduce((acc, row) => {
      acc[row.setting_key] = row.setting_value;
      return acc;
    }, {});
  },

  async update(key, value) {
    const [result] = await db.query("UPDATE settings SET setting_value = ? WHERE setting_key = ?", [
      value,
      key,
    ]);
    return result.affectedRows > 0;
  },
};

module.exports = Setting;
