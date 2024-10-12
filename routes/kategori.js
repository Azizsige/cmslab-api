const express = require("express");
const app = express();
const router = express.Router();
const kategoriController = require("../controllers/kategoriController");
const authMiddleware = require("../middleware/authMiddleware");

// render halaman
router.get("/all", kategoriController.getKategori);
router.get("/countKategori", kategoriController.countKategorisBerita);
router.get(
  "/",
  authMiddleware.authenticateToken,
  kategoriController.getKategori
);
router.post(
  "/",
  authMiddleware.authenticateToken,
  kategoriController.createKategori
);
router.delete(
  "/:id",
  authMiddleware.authenticateToken,
  kategoriController.deleteKategori
);
router.get(
  "/:id",
  authMiddleware.authenticateToken,
  kategoriController.getKategoriById
);
router.get(
  "/:id",
  authMiddleware.authenticateToken,
  kategoriController.getKategoriById
);
router.put(
  "/:id",
  authMiddleware.authenticateToken,
  kategoriController.updateKategori
);

module.exports = router;
