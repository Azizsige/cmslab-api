const express = require("express");
const router = express.Router();
const fasilitasController = require("../controllers/fasilitasController");
const authMiddleware = require("../middleware/authMiddleware");

// Express Validator
const { body } = require("express-validator");

router.get(
  "/",
  authMiddleware.authenticateToken,
  fasilitasController.getFasilitas
);
router.get("/all", fasilitasController.getFasilitas);
router.post(
  "/",
  // [
  //   // Validasi field harus diisi
  //   body("namaFasilitas").custom((value, { req }) => {
  //     //  check if input using space or not
  //     if (!value) {
  //       throw new Error("Facility name must be filled!");
  //     }
  //     return true;
  //   }),
  //   body("image").custom((value, { req }) => {
  //     // cek jika password kosong
  //     if (!value) {
  //       throw new Error("Must upload image!");
  //     }
  //     return true;
  //   }),
  // ],
  authMiddleware.authenticateToken,
  fasilitasController.createFasilitas
);
router.get(
  "/:id",
  authMiddleware.authenticateToken,
  fasilitasController.getFasilitasById
);
router.put(
  "/:id",
  authMiddleware.authenticateToken,
  fasilitasController.updateFasilitas
);
router.delete(
  "/",
  authMiddleware.authenticateToken,
  fasilitasController.deleteFasilitas
);
module.exports = router;
