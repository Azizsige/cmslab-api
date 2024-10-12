const express = require("express");
const router = express.Router();
const galeriController = require("../controllers/galeriController");
const authMiddleware = require("../middleware/authMiddleware");
const { body } = require("express-validator");
// render halaman
router.get("/", authMiddleware.authenticateToken, galeriController.getGaleri);
router.get("/all", galeriController.getGaleri);
router.post(
  "/",
  authMiddleware.authenticateToken,
  galeriController.createGaleri
);
router.get(
  "/:id",
  authMiddleware.authenticateToken,
  galeriController.getGaleriById
);
router.put(
  "/:id",
  authMiddleware.authenticateToken,
  galeriController.updateGaleri
);
router.delete(
  "/",
  authMiddleware.authenticateToken,
  galeriController.deleteGaleri
);
module.exports = router;
