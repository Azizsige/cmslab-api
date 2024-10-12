const mongoose = require("mongoose");
const Galeri = require("../models/Galeri");

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
});

const createGaleri = async (req, res) => {
  upload.array("images", 5)(req, res, async function (err) {
    // pengecekan  filter image
    if (err instanceof multer.MulterError) {
      return res.status(500).json({ status: "false", message: err.message });
    } else if (err) {
      return res.status(500).json({ status: "false", message: err.message });
    }

    try {
      const images = req.files;

      if (!images || images.length === 0)
        return res
          .status(400)
          .json({ status: "false", message: "Image tidak boleh kosong" });

      const galeriPromises = [];

      for (const image of images) {
        const storageRef = ref(storage, "galeri/" + image.originalname);

        const metadata = {
          contentType: image.mimetype,
        };

        const snapshot = await uploadBytesResumable(
          storageRef,
          image.buffer,
          metadata
        );

        const url = await getDownloadURL(snapshot.ref);
        const fileName = await snapshot.ref.name;

        const existingImage = await Galeri.findOne({
          images: fileName, // Menggunakan field 'images' untuk pengecekan
        });

        console.log(existingImage);

        if (existingImage) {
          return res.status(400).json({
            message: `Galeri dengan nama ${fileName} sudah ada`,
          });
        }

        galeriPromises.push(
          Galeri.create({
            images: fileName, // Menggunakan field 'images' untuk membuat objek Galeri
            url,
          })
        );
      }

      const galeriResults = await Promise.all(galeriPromises);

      return res.status(201).json({
        status: "true",
        message: "Galeri berhasil dibuat",
        galeriResults,
      });
    } catch (error) {
      return res.status(500).json({ status: "false", message: error.message });
    }
  });
};

const getGaleri = async (req, res) => {
  try {
    // const userId = req.user.userId;
    // const fasilitass = await Galeri.find({ userId });
    const galeri = await Galeri.find({});
    if (galeri.length === 0)
      return res.status(200).json({
        status: "false",
        message: "Data Galeri masih kosong!",
        galeri,
      });

    return res.status(200).json({ status: "true", galeri });
  } catch (error) {
    return res.status(500).json({ status: "false", message: error.message });
  }
};

const getGaleriById = async (req, res) => {
  const { id } = req.params;

  // cek apakah parameter id valid
  if (!mongoose.Types.ObjectId.isValid(id))
    return res
      .status(400)
      .json({ status: "false", message: "ID galeri tidak valid" });

  try {
    const galeri = await Galeri.findById(id);

    if (!galeri)
      return res
        .status(400)
        .json({ status: "false", message: "Galeri tidak ditemukan" });

    return res.status(200).json({ status: "true", galeri });
  } catch (error) {
    return res.status(500).json({ status: "false", message: error.message });
  }
};

// update galeri dari firebase storage dan mongodb
const updateGaleri = async (req, res) => {
  const { id } = req.params;
  upload.single("images")(req, res, async function (err) {
    // pengecekan  filter image
    if (err instanceof multer.MulterError) {
      return res.status(500).json({ status: "false", message: err.message });
    } else if (err) {
      return res.status(500).json({ status: "false", message: err.message });
    }

    try {
      const images = req.file;

      console.log("body : " + images);

      if (!images)
        return res
          .status(400)
          .json({ status: "false", message: "Image tidak boleh kosong" });

      const storageRef = ref(storage, "galeri/" + req.file.originalname);

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

      console.log("firebase" + fileName);

      const existingImage = await Galeri.findOne({ images: fileName });
      console.log("cek" + existingImage);
      if (existingImage) {
        return res.status(400).json({
          message: `Galeri dengan nama ${fileName} sudah ada`,
        });
      }

      const updatedGaleri = await Galeri.findByIdAndUpdate(
        id,
        {
          images: fileName,
          url,
        },
        { new: true }
      );

      return res.status(200).json({
        status: "true",
        message: "Galeri berhasil diupdate",
        updatedGaleri,
      });
    } catch (error) {
      return res.status(500).json({ status: "false", message: error.message });
    }
  });
};

// delete galeri dari firebase storage dan mongodb versi 2023
const deleteGaleri = async (req, res) => {
  const ids = req.body.ids.split(",");
  try {
    const galeris = await Galeri.find({ _id: { $in: ids } });

    if (galeris.length === 0) {
      return res
        .status(400)
        .json({ status: "false", message: "Galeri tidak ditemukan" });
    }

    const galeriPromises = [];

    for (const galeri of galeris) {
      // Delete image dari firebase storage
      const imageRef = ref(storage, "galeri/" + galeri.images);
      const deleteImage = deleteObject(imageRef);

      galeriPromises.push(deleteImage);
    }

    await Promise.all(galeriPromises);

    // Delete galeri dari mongodb
    const deletedGaleris = await Galeri.deleteMany({ _id: { $in: ids } });

    return res.status(200).json({
      status: "true",
      message: "Galeri berhasil dihapus",
    });
  } catch (error) {
    return res.status(500).json({ status: "false", message: error.message });
  }
};

module.exports = {
  createGaleri,
  getGaleri,
  getGaleriById,
  updateGaleri,
  deleteGaleri,
};
