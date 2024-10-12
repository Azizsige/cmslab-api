const Kategori = require("../models/Kategori");
const Berita = require("../models/Berita");

const createKategori = async (req, res) => {
  try {
    const { namaKategori } = req.body;

    // Cek apakah kategori sudah ada
    const existingKategori = await Kategori.findOne({ namaKategori });
    if (existingKategori) {
      return res
        .status(400)
        .json({ message: `Kategori ${namaKategori} sudah ada` });
    }

    const kategori = await Kategori.create({
      namaKategori,
    });

    return res.status(201).json({
      status: "true",
      message: "Kategori berhasil dibuat",
      kategori,
    });
  } catch (error) {
    return res.status(500).json({ status: "false", message: error.message });
  }
};

const getKategori = async (req, res) => {
  try {
    const kategoris = await Kategori.find({});

    if (kategoris.length == 0)
      return res
        .status(200)
        .json({ status: "false", message: "Belum ada kategori", kategoris });

    return res.status(200).json({ status: "true", kategoris });
  } catch (error) {
    return res.status(500).json({ status: "false", message: error.message });
  }
};

const deleteKategori = async (req, res) => {
  const { id } = req.params;
  try {
    const kategori = await Kategori.findByIdAndDelete(id);

    if (!kategori)
      return res
        .status(400)
        .json({ status: "false", message: "Kategori tidak ditemukan" });

    res.status(200).json({
      status: "true",
      message: `${kategori.namaKategori} berhasil dihapus`,
    });
  } catch (error) {
    res.status(500).json({ status: "false", message: error.message });
  }
};

const getKategoriById = async (req, res) => {
  const { id } = req.params;

  try {
    const kategori = await Kategori.findById(id);

    if (!kategori)
      return res
        .status(400)
        .json({ status: "false", message: "Kategori tidak ditemukan" });

    return res.status(200).json({ status: "true", kategori });
  } catch (error) {
    return res.status(500).json({ status: "false", message: error.message });
  }
};

// Update Kategori API
const updateKategori = async (req, res) => {
  const { id } = req.params;
  const { namaKategori } = req.body;

  try {
    const existingKategori = await Kategori.findOne({ namaKategori });
    if (existingKategori) {
      return res
        .status(400)
        .json({ status: "false", message: `${namaKategori} sudah ada` });
    }

    const kategori = await Kategori.findByIdAndUpdate(
      id,
      {
        namaKategori,
      },
      { new: true }
    );

    return res
      .status(200)
      .json({ status: "true", message: "Kategori berhasil diubah" });
  } catch (error) {
    return res.status(500).json({ status: "false", message: error.message });
  }
};

// hitung tag yang digunakan berapa kali di berita
const countKategorisBerita = async (req, res) => {
  try {
    const kategori = await Kategori.aggregate([
      {
        $lookup: {
          from: "beritas",
          localField: "_id",
          foreignField: "kategori",
          as: "berita",
        },
      },
      {
        $project: {
          _id: 1,
          namaKategori: 1,
          jumlahBerita: { $size: "$berita" },
        },
      },
    ]);

    return res.status(200).json({ status: "true", kategori });
  } catch (error) {
    return res.status(500).json({ status: "false", message: error.message });
  }
};

module.exports = {
  createKategori,
  getKategori,
  deleteKategori,
  getKategoriById,
  updateKategori,
  countKategorisBerita,
};
