const TaskName = require("../models/TaskName");
const User = require("../models/User");

const getListTaskName = async (req, res) => {
  try {
    const pageAccess = await PageAccess.find({}).populate({
      path: "taskName",
      select: ["taskName"],
    });

    if (pageAccess.length === 0) {
      return res
        .status(200)
        .json({ status: "false", message: "Page Access Kosong", pageAccess });
    } else {
      return res.status(200).json({ status: "true", pageAccess });
    }
  } catch (error) {}
};

const createTaskName = async (req, res) => {
  try {
    const { page, taskName } = req.body.payload;

    console.log(req.body.payload);

    if (!page)
      return res
        .status(400)
        .json({ status: "false", message: "Page harus diisi" });

    if (!taskName)
      return res
        .status(400)
        .json({ status: "false", message: "Task Name harus diisi" });

    const pageAccess = await PageAccess.create({
      page,
      taskName,
    });

    return res.status(201).json({
      status: "true",
      message: "Page Acces Berhasil Dibuat",
      pageAccess,
    });
  } catch (error) {
    return res.status(500).json({
      status: "false",
      message: error.message,
    });
  }
};

const addTaskNameToRole = async (req, res) => {
  try {
    const { userId, taskNameId } = req.body.payload;

    if (!userId)
      return res
        .status(400)
        .json({ status: "false", message: "User ID harus diisi" });

    if (!taskNameId)
      return res
        .status(400)
        .json({ status: "false", message: "Page Access ID harus diisi" });

    const user = await User.findOne({ _id: userId });

    if (!user)
      return res
        .status(404)
        .json({ status: "false", message: "User tidak ditemukan" });

    // Ganti findOne menjadi find untuk mencari berdasarkan array taskNameId
    const taskNames = await TaskName.find({ _id: { $in: taskNameId } });

    if (!taskNames || taskNames.length === 0)
      return res
        .status(404)
        .json({ status: "false", message: "Task Name tidak ditemukan" });

    // Pastikan user memiliki properti _id sebelum mencoba mengaksesnya
    if (!user._id)
      return res
        .status(500)
        .json({ status: "false", message: "ID pengguna tidak valid" });

    console.log(taskNames);

    const userWithTaskName = await User.findOneAndUpdate(
      { _id: user._id },
      { $push: { taskNames: { $each: taskNames } } },
      { new: true }
    );

    return res.status(201).json({
      status: "true",
      message: "Has Access Berhasil Ditambahkan ke User",
      userWithTaskName,
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
  addTaskNameToRole,
};
