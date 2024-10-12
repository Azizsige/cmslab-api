// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const userController = require("../controllers/userController");

const { body } = require("express-validator");

// Get All User
router.get("/", authMiddleware.authenticateToken, userController.getAllUser);

// Add New User
router.post(
  "/add",
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
  authMiddleware.authenticateToken,
  authMiddleware.checkRole(["super admin"]),
  userController.addUser
);

// Update User
router.put(
  "/update/:id",
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
  authMiddleware.authenticateToken,
  authMiddleware.checkRole(["super admin"]),
  userController.updateUser
);

// Delete User
router.delete(
  "/delete/:id",
  authMiddleware.authenticateToken,
  authMiddleware.checkRole(["super admin"]),
  userController.deleteUser
);

// Get All User
router.get(
  "/all",
  authMiddleware.authenticateToken,
  authMiddleware.checkRole(["super admin"]),
  userController.getAllUser
);

module.exports = router;
