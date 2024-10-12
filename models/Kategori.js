const mongoose = require("mongoose");

const kategoriSchema = new mongoose.Schema(
  {
    namaKategori: {
      type: String,
    },
  },
  { timestamps: true }
);

const Kategori = mongoose.model("Kategori", kategoriSchema);

module.exports = Kategori;
