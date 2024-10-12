const TaskName = require("../models/TaskName");
const User = require("../models/User");

const getListTaskName = async (req, res) => {
  try {
    const taskName = await TaskName.find({});

    if (taskName.length === 0) {
      return res
        .status(200)
        .json({ status: "false", message: "Task Name Kosong", taskName });
    } else {
      return res.status(200).json({ status: "true", taskName });
    }
  } catch (error) {}
};

const createTaskName = async (req, res) => {
  try {
    const { page, taskName } = req.body.payload;

    if (!taskName)
      return res
        .status(400)
        .json({ status: "false", message: "Task Name harus diisi" });

    if (!page)
      return res
        .status(400)
        .json({ status: "false", message: "Page harus diisi" });

    const taskNameCreate = await TaskName.create({
      page,
      taskName,
    });

    return res.status(201).json({
      status: "true",
      message: "Task Name Berhasil Dibuat",
      taskNameCreate,
    });
  } catch (error) {
    return res.status(500).json({
      status: "false",
      message: error.message,
    });
  }
};

const updateTaskName = async (req, res) => {
  try {
    const { taskNameId, page, taskName } = req.body.payload;
    // const { id } = req.params;

    if (!taskNameId)
      return res
        .status(400)
        .json({ status: "false", message: "Task Id harus diisi" });

    if (!taskName)
      return res
        .status(400)
        .json({ status: "false", message: "Task Name harus diisi" });

    if (!taskName)
      return res
        .status(400)
        .json({ status: "false", message: "Task Name harus diisi" });

    const taskNameUpdate = await TaskName.findByIdAndUpdate(id, {
      page,
      taskName,
    });

    return res.status(201).json({
      status: "true",
      message: "Task Name Berhasil Dibuat",
      taskNameUpdate,
    });
  } catch (error) {
    return res.status(500).json({
      status: "false",
      message: error.message,
    });
  }
};

const deleteTaskName = async (req, res) => {
  const { id } = req.params;

  try {
    const taskName = await TaskName.findByIdAndDelete(id);

    return res.status(200).json({
      status: "true",
      message: "Task Name Berhasil Dihapus",
      taskName,
    });
  } catch (error) {
    return res.status(500).json({
      status: "false",
      message: error.message,
    });
  }
};

module.exports = {
  getListTaskName,
  createTaskName,
  updateTaskName,
  deleteTaskName,
};
