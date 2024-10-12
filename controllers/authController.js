// controllers/authController.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validationResult, body } = require("express-validator");
const config = require("../config");
const User = require("../models/User");
const TaskName = require("../models/TaskName");
const TokenBlacklist = require("../models/TokenBlacklist");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../middleware/authMiddleware");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
// const PasswordResetToken = require("../models/PasswordResetToken");
const PasswordResetToken = require("../models/passwordResetTokenSchema");
const { use } = require("passport");

// format date
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

// Fungsi untuk mendapatkan ID pengguna dari accessToken
function getUserIdFromAccessToken(accessToken) {
  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET); // Gantilah dengan kunci rahasia Anda
    return decoded.userId; // Anggap bahwa ID pengguna disimpan dalam payload token
  } catch (error) {
    // Handle error jika token tidak valid
    return null;
  }
}

const register = async (req, res) => {
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
      return res.status(400).json({ message: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let user;

    if (role === "super admin") {
      // Jika role adalah super admin, tambahkan semua data dari koleksi TaskName ke user.taskNames
      const allTaskNames = await TaskName.find();
      user = await User.create({
        username,
        role,
        password: hashedPassword,
        taskNames: allTaskNames.map((task) => task._id),
      });
    } else {
      // Jika role adalah admin, gunakan nilai default untuk taskNames
      user = await User.create({
        username,
        role,
        password: hashedPassword,
      });
    }

    // Generate access token
    const accessToken = generateAccessToken(user._id);

    // Generate refresh token
    const refreshToken = generateRefreshToken(user._id);

    // Simpan refresh token ke dalam user
    user.refreshToken = refreshToken;
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

const login = async (req, res) => {
  try {
    // Validasi request menggunakan Express Validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // dapatkan data msg dari array errors
      const extractedErrors = [];
      errors.array().map((err) => extractedErrors.push({ msg: err.msg }));

      return res.status(400).json({ errors: extractedErrors });
    }

    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({
        status: "false",
        message: "Username atau Email belum terdaftar",
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({
        status: "false",
        message: "Password yang anda masukkan salah",
      });
    }

    // Generate access token
    const accessToken = generateAccessToken(user._id);

    // Generate refresh token
    const refreshToken = generateRefreshToken(user._id);

    // Simpan refresh token ke dalam user
    user.refreshToken = refreshToken;
    user.lastLogin = formatDate(new Date());
    await user.save();

    console.log(user.lastLogin);

    res.status(200).json({
      status: "true",
      message: "Berhasil Login",
      user,
      accessToken,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "false",
      message: "Internal Server Error or Token has been expired",
    });
  }
};

// haput token user yang sedang login dari database
// Fungsi untuk logout
const logout = async (req, res) => {
  try {
    const accessToken = req.body.accessToken;

    if (!accessToken) {
      return res.status(400).json({ message: "Access Token is required" });
    }

    const userId = getUserIdFromAccessToken(accessToken);

    if (!userId) {
      return res.status(401).json({ message: "Invalid Access Token" });
    }

    // Cari pengguna berdasarkan ID pengguna
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Add access token to blacklist
    const accessTokenBlacklist = new TokenBlacklist({ token: accessToken });
    await accessTokenBlacklist.save();

    // Add refresh token to blacklist
    const refreshTokenBlacklist = new TokenBlacklist({
      token: user.refreshToken,
    });
    await refreshTokenBlacklist.save();

    // Remove refresh token from user
    const userUpdate = await User.findByIdAndUpdate(userId, {
      refreshToken: null,
      lastLogin: user.lastLogin,
      lastLogout: formatDate(new Date()),
    });

    res
      .status(200)
      .json({ status: "true", message: "Successfully logged out" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "true", message: "Internal Server Error" });
  }
};

// refresh token
const refreshToken = async (req, res) => {
  try {
    const userId = req.body.userId; // Ganti dengan field yang sesuai di permintaan Anda
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const refreshToken = user.refreshToken;

    if (!refreshToken) {
      return res.status(403).json({ message: "No refresh token provided" });
    }

    const refreshTokenBlacklisted = await TokenBlacklist.findOne({
      token: refreshToken,
    });
    if (refreshTokenBlacklisted) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const decoded = jwt.verify(refreshToken, config.JWT_SECRET);
    const refreshedUser = await User.findById(decoded.userId);
    if (!refreshedUser) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = generateAccessToken(refreshedUser._id);

    res.status(200).json({ status: "true", accessToken: newAccessToken });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ status: "false", message: "Session sudah berakhir" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // dapatkan data msg dari array errors
      const extractedErrors = [];
      errors.array().map((err) => extractedErrors.push({ msg: err.msg }));

      return res.status(400).json({ errors: extractedErrors });
    }

    // Cari user berdasarkan email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Buat token reset password
    const token = crypto.randomBytes(20).toString("hex");
    const passwordResetToken = new PasswordResetToken({
      user: user._id,
      token,
    });
    await passwordResetToken.save();

    // Kirim email dengan tautan reset password
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: config.EMAIL_ADDRESS,
        pass: config.EMAIL_PASSWORD,
      },
    });

    const resetLink = `https://todo-mongo.vercel.app/verification-reset-password/${token}`; // Ganti your-app-url dengan URL aplikasi Anda
    const mailOptions = {
      from: config.EMAIL_ADDRESS,
      to: user.email,
      subject: "Reset Password",
      subject: "Reset Password",
      html: `
      <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
          <h2 style="color: #333;">Halo ${user.username},</h2>
          <p style="color: #666;">Kami menerima permintaan untuk mereset password akun Anda.</p>
          <p style="color: #666;">Klik tautan di bawah ini untuk mereset password:</p>
          <a href="${resetLink}" style="color: #007bff; text-decoration: none;">Reset Password</a>
          <p style="color: #666;">Jika Anda tidak melakukan permintaan ini, abaikan email ini.</p>
          <p style="color: #666;">Terima kasih,</p>
          <p style="color: #666;">Tim Support</p>
          
          <!-- Footer -->
          <div style="margin-top: 20px;">
            <img src="https://your-website.com/footer-image.png" alt="Footer Image" style="display: block; max-width: 100%; height: auto;">
            <p style="color: #666; text-align: center;">&copy; 2023 Your Company. All rights reserved.</p>
          </div>
          <!-- End of Footer -->
        </div>
    `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to send email" });
      }

      res.status(200).json({
        status: "true",
        message: "Link sudah dikirim ",
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "false", message: "Internal Server Error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // dapatkan data msg dari array errors
      const extractedErrors = [];
      errors.array().map((err) => extractedErrors.push({ msg: err.msg }));

      return res.status(400).json({ errors: extractedErrors });
    }

    // Cari token reset password
    const passwordResetToken = await PasswordResetToken.findOne({ token });
    if (!passwordResetToken) {
      return res.status(404).json({ message: "Token not found" });
    }

    if (!password) {
      return res.status(404).json({ message: "Password harus diisi" });
    }

    if (password == passwordResetToken.password) {
      return res
        .status(404)
        .json({ message: "Password tidak boleh sama dengan password lama" });
    }

    // Cari user berdasarkan token reset password
    const user = await User.findById(passwordResetToken.user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Atur password baru untuk user
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    passwordResetToken.deleteOne();

    res
      .status(200)
      .json({ status: "true", message: "Password reset successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// cek token forgotPassword di database
const verifyResetToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    const passwordResetToken = await PasswordResetToken.findOne({ token });

    const createdAt = passwordResetToken.createdAt;
    const dateCreateAt = new Date(createdAt);
    // ubah dateCreateAt ke menit yg normal
    const dateCreateAtExpired = dateCreateAt.getMinutes();

    const timestamp = Date.now();
    const dateNow = new Date(timestamp);
    const dateNowWillExpired = dateCreateAtExpired + 2;

    // console.log(dateNow.getMinutes());
    console.log(dateCreateAtExpired);
    console.log(dateNowWillExpired);

    if (!passwordResetToken) {
      return res.status(404).json({ message: "Token not found" });
    }

    if (dateNow.getMinutes() >= dateNowWillExpired) {
      return res
        .status(401)
        .json({ status: "false", message: "Token expired" });
      // console.log("token expired");
    }

    if (passwordResetToken.isUsed === true) {
      return res.status(401).json({ message: "Token has been used" });
    }

    passwordResetToken.isUsed = true;
    res.status(200).json({ status: "true", message: "Token valid", createdAt });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ status: "true", message: "User berhasil dihapus" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// cek jika token valid dan dapat role user
const checkToken = async (req, res, next) => {};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyResetToken,
  deleteUser,
};
