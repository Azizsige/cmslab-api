const express = require("express");
const router = express.Router();

const taskNameController = require("../controllers/taskNameController");
const authMiddleware = require("../middleware/authMiddleware");

router.get(
  "/",
  authMiddleware.authenticateToken,
  taskNameController.getListTaskName
);

router.post(
  "/",
  authMiddleware.authenticateToken,
  taskNameController.createTaskName
);

router.put(
  "/:id",
  authMiddleware.authenticateToken,
  taskNameController.updateTaskName
);

router.delete(
  "/",
  authMiddleware.authenticateToken,
  taskNameController.deleteTaskName
);

module.exports = router;
