const mongoose = require("mongoose");

const beritaSchema = new mongoose.Schema(
  {
    image: {
      type: String,
    },
    judul: {
      type: String,
    },
    konten: {
      type: String,
    },
    kategori: {
      type: mongoose.Types.ObjectId, // Ubah tipe data menjadi mongoose.Types.ObjectId
      ref: "Kategori", // Nama model Kategori
    },
    tags: [
      {
        type: mongoose.Types.ObjectId, // Ubah tipe data menjadi mongoose.Types.ObjectId
        ref: "Tag", // Nama model Tag
      },
    ],
    url: {
      type: String,
    },
  },
  { timestamps: true }
);

const Berita = mongoose.model("Berita", beritaSchema);

module.exports = Berita;
