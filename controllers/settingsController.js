const Setting = require("../models/settingModel");

exports.getSettingsPage = async (req, res) => {
  try {
    const settings = await Setting.getAll();
    res.render("settings", {
      nonce: res.locals.nonce,
      settings: settings,
      activePage: "settings",
      title: "Settings | StreamVision",
      user: req.user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { app_name } = req.body;
    await Setting.update("app_name", app_name);
    res.redirect("/settings");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};
