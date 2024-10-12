const mongoose = require("mongoose");
const Slider = require("../models/Slider");

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

const createSlider = async (req, res) => {
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

      const slidersPromises = [];

      for (const image of images) {
        const storageRef = ref(storage, "sliders/" + image.originalname);

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

        const existingImage = await Slider.findOne({
          images: fileName, // Menggunakan field 'images' untuk pengecekan
        });

        console.log(existingImage);

        if (existingImage) {
          return res.status(400).json({
            message: `Slider dengan nama file ${fileName} sudah ada`,
          });
        }

        slidersPromises.push(
          Slider.create({
            images: fileName, // Menggunakan field 'images' untuk membuat objek Galeri
            url,
          })
        );
      }

      const slidersResults = await Promise.all(slidersPromises);

      return res.status(201).json({
        status: "true",
        message: "Image Slider baru berhasil ditambahkan",
        slidersResults,
      });
    } catch (error) {
      return res.status(500).json({ status: "false", message: error.message });
    }
  });
};

const getSliders = async (req, res) => {
  try {
    // const userId = req.user.userId;
    // const fasilitass = await Slider.find({ userId });
    const slider = await Slider.find({});
    if (slider.length === 0)
      return res.status(200).json({
        status: "false",
        message: "Data Slider is empty",
        slider,
      });

    return res.status(200).json({ status: "true", slider });
  } catch (error) {
    return res.status(500).json({ status: "false", message: error.message });
  }
};

const getSliderById = async (req, res) => {
  const { id } = req.params;

  // cek apakah parameter id valid
  if (!mongoose.Types.ObjectId.isValid(id))
    return res
      .status(400)
      .json({ status: "false", message: "ID Slider is not valid!" });

  try {
    const slider = await Slider.findById(id);

    if (!slider)
      return res
        .status(400)
        .json({ status: "false", message: "Slider not found!" });

    return res.status(200).json({ status: "true", slider });
  } catch (error) {
    return res.status(500).json({ status: "false", message: error.message });
  }
};

// update galeri dari firebase storage dan mongodb
const updateSlider = async (req, res) => {
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

      if (!images)
        return res
          .status(400)
          .json({ status: "false", message: "Slider Image is required!" });

      const storageRef = ref(storage, "sliders/" + req.file.originalname);

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

      const existingImage = await Slider.findOne({ images: fileName });
      if (existingImage) {
        return res.status(400).json({
          // pesan dengan bahasa inggris
          message: `Slider with name ${fileName} already exist`,
        });
      }

      const updatedSlider = await Slider.findByIdAndUpdate(
        id,
        {
          images: fileName,
          url,
        },
        { new: true }
      );

      return res.status(200).json({
        status: "true",
        message: "Gambar Slider berhasil di update",
        updatedSlider,
      });
    } catch (error) {
      return res.status(500).json({ status: "false", message: error.message });
    }
  });
};

// delete galeri dari firebase storage dan mongodb versi 2023
const deleteSlider = async (req, res) => {
  const ids = req.body.ids.split(",");
  try {
    const sliders = await Slider.find({ _id: { $in: ids } });

    if (sliders.length === 0) {
      return res
        .status(400)
        .json({ status: "false", message: "Slider not found!" });
    }

    const sliderPromises = [];

    for (const slider of sliders) {
      // Delete image dari firebase storage
      const imageRef = ref(storage, "sliders/" + slider.images);
      const deleteImage = deleteObject(imageRef);

      sliderPromises.push(deleteImage);
    }

    await Promise.all(sliderPromises);

    // Delete galeri dari mongodb
    const deletedSliders = await Slider.deleteMany({ _id: { $in: ids } });

    return res.status(200).json({
      status: "true",
      message: "Slider successfully deleted",
    });
  } catch (error) {
    return res.status(500).json({ status: "false", message: error.message });
  }
};

module.exports = {
  createSlider,
  // createManySlider,
  getSliders,
  getSliderById,
  updateSlider,
  deleteSlider,
};
