const mongoose = require("mongoose");
const Berita = require("../models/Berita");
const Kategori = require("../models/Kategori");
const Tag = require("../models/Tags");

const {
  firebaseConfig,
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} = require("../config/firebase.config");

const { initializeApp } = require("firebase/app");

initializeApp(firebaseConfig);
const storage = getStorage();

const multer = require("multer");
const fs = require("fs");

// image filter
let imageFilter = function (req, file, cb) {
  // accept image files only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|jfif)$/i)) {
    return cb(new Error("Only image files are allowed!"), false);
  }
  cb(null, true);
};

// upload image with filter
let upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFilter,
}).single("image");

const createBerita = async (req, res) => {
  upload(req, res, async function (err) {
    // pengecekan  filter image
    if (err instanceof multer.MulterError) {
      return res.status(500).json({ status: "false", message: err.message });
    } else if (err) {
      return res.status(500).json({ status: "false", message: err.message });
    }

    try {
      const { judul, konten, kategori } = req.body;
      let { tags } = req.body;
      const image = req.file;

      const storageRef = ref(storage, "berita/" + req.file.originalname);

      const metadata = {
        contentType: req.file.mimetype,
      };

      const snapshot = await uploadBytesResumable(
        storageRef,
        req.file.buffer,
        metadata
      );

      const url = await getDownloadURL(snapshot.ref);

      tags = tags.split(",");

      // const userId = req.user.userId;

      if (!judul) {
        return res.status(400).json({
          status: "false",
          message: "Title is required!",
        });
      }

      if (!konten) {
        return res.status(400).json({
          status: "false",
          message: "Content is required!",
        });
      }

      const existingJudul = await Berita.findOne({ judul });
      if (existingJudul) {
        return res
          .status(400)
          .json({ status: "false", message: `Title ${judul} has been exist!` });
      }

      const isValidTags = tags.every((tag) =>
        mongoose.Types.ObjectId.isValid(tag)
      );

      if (!isValidTags) {
        return res
          .status(400)
          .json({ message: "Tags harus berisi ID yang valid" });
      }

      if (!mongoose.Types.ObjectId.isValid(kategori)) {
        return res.status(400).json({
          status: "false",
          message: "Kategori harus berisi ID yang valid",
        });
      }

      const fileName = await snapshot.ref.name;
      console.log(fileName);
      const existingImage = await Berita.findOne({ image: fileName });
      if (existingImage) {
        return res.status(400).json({
          status: "false",
          message: `Image ${fileName} has been exist!`,
        });
      }

      const berita = await Berita.create({
        image: fileName,
        judul,
        konten,
        kategori,
        tags,
        url,
      });

      return res
        .status(201)
        .json({ status: "true", message: "Berita berhasil dibuat", berita });
    } catch (error) {
      return res.status(500).json({ status: "false", message: error.message });
    }
  });
};

const getBerita = async (req, res) => {
  try {
    // const userId = req.user.userId;
    // const beritas = await Berita.find({ userId });
    const berita = await Berita.find({})
      .populate({
        path: "tags",
        select: ["namaTag"],
      })
      .populate({
        path: "kategori",
        select: ["namaKategori"],
      });

    if (berita.length === 0)
      return res.status(200).json({
        status: "false",
        message: "Data Berita masih kosong!",
        berita,
      });

    return res.status(200).json({ status: "true", berita });
  } catch (error) {
    return res.status(500).json({ status: "false", message: error.message });
  }
};

const getBeritaById = async (req, res) => {
  const { id } = req.params;

  console.log("IHIIHI");
  // cek apakah parameter id valid
  if (!mongoose.Types.ObjectId.isValid(id))
    return res
      .status(400)
      .json({ status: "false", message: "ID fasilitas tidak valid" });

  try {
    const berita = await Berita.findById(id)
      .populate("kategori")
      .populate({
        path: "tags",
        populate: {
          path: "author",
          model: "User",
          select: ["username"],
        },
      })
      .exec();

    if (!berita)
      return res
        .status(400)
        .json({ status: "false", message: "Berita tidak ditemukan" });

    return res.status(200).json({ status: "true", berita });
  } catch (error) {
    return res.status(500).json({ status: "false", message: error.message });
  }
};

const getBeritaByTagName = async (req, res) => {
  const { namaTags } = req.query;

  if (!namaTags) {
    return res
      .status(400)
      .json({ status: "false", message: "namaTags parameter is required" });
  }

  const tags = namaTags.split(",");

  console.log("HAHAHA");
  try {
    const tagIds = await Tag.find({ namaTag: { $in: tags } }).distinct("_id");

    if (tagIds.length === 0) {
      return res.status(400).json({
        status: "false",
        message: "Tags not found",
      });
    }

    const berita = await Berita.find({ tags: { $in: tagIds } })
      .populate("kategori")
      .populate({
        path: "tags",
        populate: {
          path: "author",
          model: "User",
          select: ["username"],
        },
      })
      .exec();

    if (!berita || berita.length === 0) {
      return res
        .status(400)
        .json({ status: "false", message: "Berita tidak ditemukan" });
    }

    return res.status(200).json({ status: "true", berita });
  } catch (error) {
    return res.status(500).json({ status: "false", message: error.message });
  }
};

const getBeritaByKategori = async (req, res) => {
  const { namaKategori } = req.query;

  if (!namaKategori) {
    return res
      .status(400)
      .json({ status: "false", message: "namaKategori parameter is required" });
  }

  try {
    const kategoriIds = await Kategori.find({
      namaKategori: namaKategori,
    });

    if (kategoriIds.length === 0) {
      return res.status(400).json({
        status: "false",
        message: "Kategori not found",
      });
    }

    const berita = await Berita.find({ kategori: kategoriIds[0]._id })
      .populate("kategori")
      .populate({
        path: "tags",
        populate: {
          path: "author",
          model: "User",
          select: ["username"],
        },
      })
      .exec();

    if (!berita || berita.length === 0) {
      return res
        .status(400)
        .json({ status: "false", message: "Berita tidak ditemukan" });
    }

    return res.status(200).json({ status: "true", berita });
  } catch (error) {
    return res.status(500).json({ status: "false", message: error.message });
  }
};

// update Berita API
const updateBerita = async (req, res) => {
  upload(req, res, async function (err) {
    // pengecekan  filter image
    if (err instanceof multer.MulterError) {
      return res.status(500).json({ status: "false", message: err.message });
    } else if (err) {
      return res.status(500).json({ status: "false", message: err.message });
    }

    const { id } = req.params;
    const { judul, konten, kategori } = req.body;
    let { tags } = req.body;
    const image = req.file;

    const storageRef = ref(storage, "berita/" + req.file.originalname);

    const metadata = {
      contentType: req.file.mimetype,
    };

    const snapshot = await uploadBytesResumable(
      storageRef,
      req.file.buffer,
      metadata
    );

    const url = await getDownloadURL(snapshot.ref);
    const fileName = await snapshot.ref.name;

    tags = tags.split(",");

    // cek apakah parameter id valid
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({
        status: "false",
        message: "There's something wrong in your parameters",
      });

    try {
      const berita = await Berita.findById(id);

      if (!berita) {
        return res
          .status(400)
          .json({ status: "false", message: "Berita tidak ditemukan" });
      }

      if (!tags) {
        return res
          .status(400)
          .json({ status: "false", message: "Tags is required!" });
      }

      const isValidTags = tags.every((tag) =>
        mongoose.Types.ObjectId.isValid(tag)
      );

      if (!isValidTags) {
        return res
          .status(400)
          .json({ message: "Tags harus berisi ID yang valid" });
      }

      if (!mongoose.Types.ObjectId.isValid(kategori)) {
        return res.status(400).json({
          status: "false",
          message: "Kategori harus berisi ID yang valid",
        });
      }

      // cek apakah ada perubahan gambar dengan membandingkan filename
      if (req.file && req.file.filename !== berita.image) {
        // hapus gambar lama dari local
        console.log("hapus gambar lama dari local");
        berita.image = req.file.filename;
      }

      berita.judul = judul;
      berita.konten = konten;
      berita.kategori = kategori;
      berita.tags = tags;
      berita.image = fileName;
      berita.url = url;

      await berita.save();

      return res.status(200).json({
        status: "true",
        message: `${berita.judul} berhasil diupdate`,
        berita,
      });
    } catch (error) {
      return res.status(500).json({ status: "false", message: error.message });
    }
  });
};

const deleteBerita = async (req, res) => {
  const ids = req.body.ids.split(",");
  try {
    const beritas = await Berita.find({ _id: { $in: ids } });

    if (beritas.length === 0) {
      return res
        .status(400)
        .json({ status: "false", message: "Berita not found!" });
    }

    const beritaPromises = [];

    for (const berita of beritas) {
      // Memastikan berita.image ada dan memiliki nilai sebelum menghapus
      if (berita.image) {
        // Delete image dari firebase storage
        const imageRef = ref(storage, "berita/" + berita.image);
        const deleteImage = deleteObject(imageRef);

        beritaPromises.push(deleteImage);
      }
    }

    await Promise.all(beritaPromises);

    // Delete berita dari mongodb
    const deletedBeritas = await Berita.deleteMany({ _id: { $in: ids } });

    return res.status(200).json({
      status: "true",
      message: "Berita successfully deleted",
    });
  } catch (error) {
    return res.status(500).json({ status: "false", message: error.message });
  }
};

module.exports = {
  createBerita,
  getBerita,
  getBeritaById,
  getBeritaByTagName,
  getBeritaByKategori,
  updateBerita,
  deleteBerita,
};
