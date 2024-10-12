// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const passport = require("passport");
const { body } = require("express-validator");

// validasi token
router.get("/validate", authMiddleware.authenticateToken, (req, res) => {
  res
    .status(200)
    .json({ status: "true", message: "Token is valid", result: req.role });
});

router.post(
  "/register",
  [
    // Validasi field harus diisi
    body("username").custom((value, { req }) => {
      //  check if input using space or not
      if (!value) {
        throw new Error("Username harus diisi");
      } else if (value.match(/\s/g)) {
        throw new Error("Username tidak boleh menggunakan spasi");
      }
      return true;
    }),
    body("password").custom((value, { req }) => {
      // cek jika password kosong
      if (!value) {
        throw new Error("Password harus diisi");
      } else if (value.length < 6) {
        // cek jika panjang password kurang dari 6 karakter
        throw new Error("Password minimal 6 karakter");
      }
      return true;
    }),
  ],
  authController.register
);
router.post(
  "/login",
  [
    // Validasi field harus diisi
    body("username").custom(async (value, { req }) => {
      //  check if input using space or not
      if (!value) {
        throw new Error("Username atau email harus diisi");
      } else {
        if (value.match(/\s/g)) {
          throw new Error("Username tidak boleh menggunakan spasi");
        }
      }
    }),
    body("password").custom((value, { req }) => {
      // cek jika password kosong
      if (!value) {
        throw new Error("Password harus diisi");
      } else if (value.length < 6) {
        // cek jika panjang password kurang dari 6 karakter
        throw new Error("Password minimal 6 karakter");
      }
      return true;
    }),
  ],
  authController.login
);
router.delete(
  "/delete",
  authMiddleware.authenticateToken,
  authMiddleware.checkRole,
  authController.deleteUser
);
router.post("/logout", authController.logout);
router.post("/refresh-token", authController.refreshToken);
router.post(
  "/forgot-password",
  [
    // Validasi field harus diisi

    body("email").custom((value, { req }) => {
      //  check email harus pakai @
      if (!value) {
        throw new Error("Email harus diisi huhuh");
      }

      // check email harus @gmail atau @yahoo
      if (!value.match(/^[^\s@]+@(gmail|yahoo)\.com$/)) {
        throw new Error("Email tidak valid");
      }
      return true;
    }),
  ],
  authController.forgotPassword
);
router.get("/verify-token/:token", authController.verifyResetToken);
router.post(
  "/reset-password/:token",
  [
    // Validasi field harus diisi

    body("password").custom((value, { req }) => {
      // cek jika password kosong
      if (!value) {
        throw new Error("Password harus diisi");
      } else if (value.length < 6) {
        // cek jika panjang password kurang dari 6 karakter
        throw new Error("Password minimal 6 karakter");
      }
      return true;
    }),

    // Validasi konfirmasi password
  ],
  authController.resetPassword
);

module.exports = router;
