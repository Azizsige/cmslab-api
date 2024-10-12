const express = require("express");
const mongoose = require("mongoose");
const expressLayout = require("express-ejs-layouts");
const connectDB = require("./config/db");
const session = require("express-session");
const flash = require("connect-flash");
const app = express();
const methodOverride = require("method-override");
const config = require("./config");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const beritaRoutes = require("./routes/berita");
const kategoriRoutes = require("./routes/kategori");
const tagsRoutes = require("./routes/tags");
const fasilitasRoutes = require("./routes/fasilitas");
const galeriRoutes = require("./routes/galeri");
const sliderRoutes = require("./routes/slider");
const pageAccessRoutes = require("./routes/page-access");
const taskNameRoutes = require("./routes/taskName");

const port = 5000;
const cors = require("cors");

// app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 day
    },
  })
);

app.use(express.json());
// Menggunakan middleware CORS
app.use(cors());

// routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/berita", beritaRoutes);
app.use("/api/kategori", kategoriRoutes);
app.use("/api/tags", tagsRoutes);
app.use("/api/fasilitas", fasilitasRoutes);
app.use("/api/galeri", galeriRoutes);
app.use("/api/slider", sliderRoutes);
app.use("/api/pageAccess", pageAccessRoutes);
app.use("/api/taskName", taskNameRoutes);

// app.use(
//   cors({
//     origin: "https://todo-mongo.vercel.app/",
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

mongoose
  .connect(config.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(5000, () => {
      console.log("Server started on port 5000");
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB:", error);
  });

module.exports = app;
