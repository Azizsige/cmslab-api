const express = require("express");
const router = express.Router();

const tagController = require("../controllers/tagsController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware.authenticateToken, tagController.getTag);
router.get("/all", tagController.getAllTag);
router.post("/", authMiddleware.authenticateToken, tagController.createTag);
router.delete(
  "/:id",
  authMiddleware.authenticateToken,
  tagController.deleteTag
);
router.delete(
  "/many/",
  authMiddleware.authenticateToken,
  tagController.deleteTagMany
);
router.get("/:id", authMiddleware.authenticateToken, tagController.getTagById);
router.put("/:id", authMiddleware.authenticateToken, tagController.updateTag);

module.exports = router;
