const mongoose = require("mongoose");
const Fasilitas = require("../models/Fasilitas");

const { validationResult, body } = require("express-validator");
const multer = require("multer");
const fs = require("fs");

// firebase config
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

// image upload
let storage = getStorage();

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

const createFasilitas = async (req, res) => {
  upload(req, res, async function (err) {
    // pengecekan  filter image
    if (err instanceof multer.MulterError) {
      return res.status(500).json({ status: "false", message: err.message });
    } else if (err) {
      return res.status(500).json({ status: "false", message: err.message });
    }

    try {
      const { namaFasilitas } = req.body;
      const image = req.file;

      if (!namaFasilitas) {
        return res.status(400).json({
          status: "false",
          message: "Nama fasilitas harus diisi",
        });
      }

      if (!image) {
        return res.status(400).json({
          status: "false",
          message: "Gambar fasilitas harus diisi",
        });
      }

      const storageRef = ref(storage, "fasilitas/" + req.file.originalname);

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

      const existingImage = await Fasilitas.findOne({ image: fileName });
      if (existingImage) {
        return res.status(400).json({
          message: `Gambar fasilitas dengan nama ${fileName} sudah ada`,
        });
      }

      const existingNamaFasilitas = await Fasilitas.findOne({ namaFasilitas });
      if (existingNamaFasilitas) {
        return res.status(400).json({
          status: "false",
          message: `Fasilitas dengan nama ${namaFasilitas} sudah ada`,
        });
      }

      const fasilitas = await Fasilitas.create({
        namaFasilitas,
        image: fileName,
        url,
      });

      return res.status(201).json({
        status: "true",
        message: "Fasilitas berhasil dibuat",
        fasilitas,
      });
    } catch (error) {
      return res.status(500).json({ status: "false", message: error.message });
    }
  });
};

const getFasilitas = async (req, res) => {
  try {
    // const userId = req.user.userId;
    // const fasilitass = await Galeri.find({ userId });
    const fasilitas = await Fasilitas.find({});
    if (fasilitas.length === 0)
      return res.status(200).json({
        status: "false",
        message: "Data Fasilitas masih kosong!",
        fasilitas,
      });

    return res.status(200).json({ status: "true", fasilitas });
  } catch (error) {
    return res.status(500).json({ status: "false", message: error.message });
  }
};

const getFasilitasById = async (req, res) => {
  const { id } = req.params;

  // cek apakah parameter id valid
  if (!mongoose.Types.ObjectId.isValid(id))
    return res
      .status(400)
      .json({ status: "false", message: "ID Fasilitas tidak valid" });

  try {
    const fasilitas = await Fasilitas.findById(id);

    if (!fasilitas)
      return res
        .status(400)
        .json({ status: "false", message: "Fasilitas tidak ditemukan" });

    return res.status(200).json({ status: "true", fasilitas });
  } catch (error) {
    return res.status(500).json({ status: "false", message: error.message });
  }
};

// update galeri dari firebase storage dan mongodb
const updateFasilitas = async (req, res) => {
  const { id } = req.params;
  upload(req, res, async function (err) {
    // pengecekan  filter image
    if (err instanceof multer.MulterError) {
      return res.status(500).json({ status: "false", message: err.message });
    } else if (err) {
      return res.status(500).json({ status: "false", message: err.message });
    }

    try {
      const { namaFasilitas } = req.body;
      const image = req.file;

      if (!namaFasilitas)
        return res
          .status(400)
          .json({ status: "false", message: "Nama fasilitas harus diisi" });

      const storageRef = ref(storage, "fasilitas/" + req.file.originalname);

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

      const updatedFasilitas = await Fasilitas.findByIdAndUpdate(
        id,
        {
          namaFasilitas,
          image: fileName,
          url,
        },
        { new: true }
      );

      return res.status(200).json({
        status: "true",
        message: `${updatedFasilitas.namaFasilitas} berhasil diupdate`,
        updatedFasilitas,
      });
    } catch (error) {
      return res.status(500).json({ status: "false", message: error.message });
    }
  });
};

// delete galeri dari firebase storage dan mongodb versi 2023
const deleteFasilitas = async (req, res) => {
  const ids = req.body.ids.split(",");
  try {
    const fasilities = await Fasilitas.find({ _id: { $in: ids } });

    if (fasilities.length === 0) {
      return res
        .status(400)
        .json({ status: "false", message: "Fasilitas tidak ditemukan" });
    }

    const galeriPromises = [];

    for (const fasilitas of fasilities) {
      // Delete image dari firebase storage
      const imageRef = ref(storage, "fasilitas/" + fasilitas.image);

      if (!imageRef)
        return res.status(400).json({
          status: "false",
          message: "Gambar fasilitas tidak ditemukan",
        });

      const deleteImage = deleteObject(imageRef);

      galeriPromises.push(deleteImage);
    }

    await Promise.all(galeriPromises);

    // Delete galeri dari mongodb
    const deletedfasilities = await Fasilitas.deleteMany({ _id: { $in: ids } });

    return res.status(200).json({
      status: "true",
      message: "Fasilitas berhasil dihapus",
    });
  } catch (error) {
    return res.status(500).json({ status: "false", message: error.message });
  }
};

module.exports = {
  createFasilitas,
  getFasilitas,
  getFasilitasById,
  updateFasilitas,
  deleteFasilitas,
};
