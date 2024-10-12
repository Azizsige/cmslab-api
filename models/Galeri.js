const mongoose = require("mongoose");

const galeriSchema = new mongoose.Schema(
  {
    images: {
      type: String,
    },
    url: {
      type: String,
    },
  },
  { timestamps: true }
);

// buat agar field '_id' menjadi id
galeriSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

const Galeri = mongoose.model("Galeri", galeriSchema);

module.exports = Galeri;
