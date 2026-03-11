const { body, validationResult } = require("express-validator");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: "error", errors: errors.array() });
  }
  next();
};

const dvrSchema = [
  body("dvr_name").trim().isLength({ min: 3, max: 100 }).withMessage("DVR Name must be 3-100 characters"),
  body("location_id").notEmpty().withMessage("Location is required"),
  body("new_location").optional({ checkFalsy: true }).trim().isLength({ min: 2 }).withMessage("New location name is too short"),
];

const cameraSchema = [
  body("camera_name").trim().isLength({ min: 2, max: 100 }).withMessage("Camera Name must be 2-100 characters"),
  body("rtsp_url")
    .trim()
    .custom((value) => value.startsWith("rtsp://"))
    .withMessage("Invalid RTSP URL format (must start with rtsp://)"),
  body("dvr_id").optional().isInt().withMessage("Invalid DVR ID"),
];

const loginSchema = [
  body("username").optional().trim().notEmpty().withMessage("Username is required"),
  body("email").optional().trim().isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

const passwordChangeSchema = [
  body("currentPassword").notEmpty(),
  body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters"),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error("Passwords do not match");
    }
    return true;
  }),
];

module.exports = {
  validate,
  dvrSchema,
  cameraSchema,
  loginSchema,
  passwordChangeSchema,
};
