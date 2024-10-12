const mongoose = require("mongoose");

const fasilitasSchema = new mongoose.Schema(
  {
    image: {
      type: String,
    },
    namaFasilitas: {
      type: String,
    },
    url: {
      type: String,
    },
  },
  { timestamps: true }
);

const Fasilitas = mongoose.model("Fasilitas", fasilitasSchema);

module.exports = Fasilitas;
