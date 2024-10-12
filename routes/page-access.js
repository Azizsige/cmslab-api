const express = require("express");
const router = express.Router();

const pageAccessController = require("../controllers/pageAccessController");
const authMiddleware = require("../middleware/authMiddleware");

router.get(
  "/",
  authMiddleware.authenticateToken,
  pageAccessController.getListTaskName
);
router.post(
  "/",
  authMiddleware.authenticateToken,
  pageAccessController.createTaskName
);
router.post(
  "/addTaskNameToRole",
  authMiddleware.authenticateToken,
  pageAccessController.addTaskNameToRole
);

module.exports = router;
