const mongoose = require("mongoose");
const config = require("./../config");
mongoose.set("strictQuery", false);

const connectDB = async () => {
  try {
    mongoose
      .connect(config.DB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then(() => {
        console.log("Connected to MongoDB");
      })
      .catch((error) => {
        console.error("Failed to connect to MongoDB:", error);
      });
  } catch (error) {
    console.error(error);
  }
};

module.exports = connectDB;
