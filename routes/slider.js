const express = require("express");
const router = express.Router();
const sliderController = require("../controllers/sliderController");
const authMiddleware = require("../middleware/authMiddleware");
const { body } = require("express-validator");
// render halaman
router.get("/", authMiddleware.authenticateToken, sliderController.getSliders);
router.post(
  "/",
  authMiddleware.authenticateToken,
  sliderController.createSlider
);
router.get(
  "/:id",
  authMiddleware.authenticateToken,
  sliderController.getSliderById
);
router.put(
  "/:id",

  authMiddleware.authenticateToken,
  sliderController.updateSlider
);
router.delete(
  "/",

  authMiddleware.authenticateToken,
  sliderController.deleteSlider
);
module.exports = router;
