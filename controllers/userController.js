// controllers/userController.js
const User = require("../models/User");
const TaskName = require("../models/TaskName");
const { checkRole } = require("../middleware/authMiddleware");
const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const e = require("express");

function formatDate(date) {
  const isoDate = new Date(date);

  // Mendapatkan nama hari dari objek Date
  const day = isoDate.toLocaleString("en-US", { weekday: "long" });
  // Mendapatkan tanggal, tahun, jam, menit, dan detik dari objek Date
  const dayNumber = isoDate.getDate();
  const year = isoDate.getFullYear();
  const hours = String(isoDate.getHours()).padStart(2, "0");
  const minutes = String(isoDate.getMinutes()).padStart(2, "0");
  const seconds = String(isoDate.getSeconds()).padStart(2, "0");

  // Format ulang informasi yang diperoleh ke dalam format yang diinginkan
  const formattedDate = `${day} ${dayNumber} ${year} ${hours}:${minutes}:${seconds}`;

  return formattedDate;
}

// cek validasi token jika benar
const checkToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ status: "false", message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token is blacklisted
    const isBlacklisted = await TokenBlacklist.findOne({ token });
    if (isBlacklisted) {
      return res
        .status(401)
        .json({ status: "false", message: "Token is blacklisted" });
    }

    // Set user to request object
    req.user = { userId: decoded.userId };
    next();
  } catch (error) {
    console.error(error);
    return res
      .status(403)
      .json({ status: "false", message: "Invalid token or token expired" });
  }
};

const getAllUser = async (req, res) => {
  //  melakukan pengecekan role user yg login
  try {
    const users = await User.find({}).select("-password");
    return res.status(200).json({ status: "true", users });
  } catch (error) {
    return res.status(500).json({ status: "false", message: error.message });
  }
};

const addUser = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    const existingUser = await User.findOne({ username });

    // Validasi request menggunakan Express Validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Dapatkan data msg dari array errors
      const extractedErrors = errors.array().map((err) => ({ msg: err.msg }));
      return res.status(400).json({ errors: extractedErrors });
    }

    if (existingUser) {
      return res.status(400).json({
        status: "false",
        message: `${username} has already existed!`,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let user;

    user = await User.create({
      username,
      password: hashedPassword,
    });

    await user.save();

    res.status(201).json({
      status: "true",
      message: "Registration successful",
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "false",
      message: "Internal Server Error or Token has been expired",
    });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, password } = req.body;

  try {
    const existingUser = await User.findOne({ _id: id });

    if (!existingUser) {
      return res
        .status(400)
        .json({ status: "false", message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.findByIdAndUpdate(
      id,
      {
        username,
        password: hashedPassword,
      },
      { new: true }
    );

    return res
      .status(200)
      .json({ status: "true", message: `${username} has been updated`, user });
  } catch (error) {
    return res.status(500).json({ status: "false", message: error.message });
  }
};

const deleteUser = async (req, res) => {
  const ids = req.params.id.split(",");

  try {
    const deleteUsers = await User.deleteMany({ _id: { $in: ids } });

    if (deleteUsers.deletedCount === 0) {
      return res
        .status(400)
        .json({ status: "false", message: "User not found" });
    }

    return res
      .status(200)
      .json({ status: "true", message: "User has been deleted" });
  } catch (error) {
    return res.status(500).json({ status: "false", message: error.message });
  }
};

module.exports = {
  getAllUser,
  addUser,
  updateUser,
  deleteUser,
  checkToken,
};
