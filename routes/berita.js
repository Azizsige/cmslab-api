const express = require("express");
const router = express.Router();
const beritaController = require("../controllers/beritaController");
const authMiddleware = require("../middleware/authMiddleware");
// render halaman
router.get("/", authMiddleware.authenticateToken, beritaController.getBerita);
router.get("/all", beritaController.getBerita);
router.post(
  "/",
  authMiddleware.authenticateToken,
  beritaController.createBerita
);
router.get(
  "/byTag",
  authMiddleware.authenticateToken,
  beritaController.getBeritaByTagName
);
router.get(
  "/byKategori",
  authMiddleware.authenticateToken,
  beritaController.getBeritaByKategori
);
router.get(
  "/:id",
  authMiddleware.authenticateToken,
  beritaController.getBeritaById
);
router.get("/all/:id", beritaController.getBeritaById);
router.put(
  "/:id",
  authMiddleware.authenticateToken,
  beritaController.updateBerita
);
router.delete(
  "/",
  authMiddleware.authenticateToken,
  beritaController.deleteBerita
);

module.exports = router;
