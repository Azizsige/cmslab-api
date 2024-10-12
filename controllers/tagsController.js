const Tags = require("../models/Tags");

const createTag = async (req, res) => {
  try {
    const { namaTag } = req.body;
    const userId = req.user.userId;

    if (!namaTag)
      return res
        .status(400)
        .json({ status: "false", message: "Nama Tag harus diisi" });

    // Cek apakah kategori sudah ada
    const existingTag = await Tags.findOne({ namaTag });
    if (existingTag) {
      return res
        .status(400)
        .json({ status: "false", message: `Tag ${namaTag} sudah ada` });
    }

    const tag = await Tags.create({
      namaTag,
      author: userId,
    });

    return res.status(201).json({
      status: "true",
      message: "Tag berhasil dibuat",
      author: userId,
      tag,
    });
  } catch (error) {
    return res.status(500).json({ status: "false", message: error.message });
  }
};

const getTag = async (req, res) => {
  try {
    const userId = req.user.userId;
    const tags = await Tags.find({}).populate({
      path: "author",
      select: ["username"],
    });

    if (tags.length === 0) {
      return res
        .status(200)
        .json({ status: "false", message: "Tag kosong", tags });
    } else {
      return res.status(200).json({ status: "true", tags });
    }
  } catch (error) {
    return res.status(500).json({ status: "false", message: error.message });
  }
};
const getAllTag = async (req, res) => {
  try {
    const tags = await Tags.find({}).populate({
      path: "author",
      select: ["username"],
    });

    if (tags.length === 0) {
      return res
        .status(200)
        .json({ status: "false", message: "Tag kosong", tags });
    } else {
      return res.status(200).json({ status: "true", tags });
    }
  } catch (error) {
    return res.status(500).json({ status: "false", message: error.message });
  }
};

const deleteTag = async (req, res) => {
  const { id } = req.params;
  try {
    const tag = await Tags.findByIdAndDelete(id);

    return res
      .status(200)
      .json({ status: "true", message: `${tag.namaTag} berhasil dihapus` });
  } catch (error) {
    return res.status(500).json({ status: "false", message: error.message });
  }
};

const deleteTagMany = async (req, res) => {
  const { ids } = req.body;

  try {
    const deleteTags = await Tags.deleteMany({ _id: { $in: ids } });

    if (deleteTags.deletedCount === 0) {
      return res
        .status(400)
        .json({ status: "false", message: "Tag tidak ditemukan" });
    }

    return res
      .status(200)
      .json({ status: "true", message: "Tag berhasil dihapus" });
  } catch (error) {
    return res.status(500).json({ status: "false", message: error.message });
  }
};

// get Tag By Id API
const getTagById = async (req, res) => {
  const { id } = req.params;

  try {
    const tag = await Tags.findById(id).populate({
      path: "author",
      select: ["username"],
    });
    res.status(200).json({ status: "true", tag });
  } catch (error) {
    res.status(500).json({ status: "false", message: error.message });
  }
};

// Update Tag API
const updateTag = async (req, res) => {
  const { id } = req.params;
  const { namaTag } = req.body;
  const userId = req.user.userId;

  try {
    const existingTag = await Tags.findOne({ namaTag });
    if (existingTag) {
      return res
        .status(400)
        .json({ status: "false", message: `${namaTag} sudah ada` });
    }

    const tag = await Tags.findByIdAndUpdate(
      id,
      {
        namaTag,
        author: userId,
      },
      { new: true }
    );

    return res
      .status(200)
      .json({ status: "true", message: "Tag berhasil diubah", tag });
  } catch (error) {
    res.status(500).json({ status: "false", message: error.message });
  }
};

module.exports = {
  createTag,
  getTag,
  getAllTag,
  deleteTag,
  deleteTagMany,
  getTagById,
  updateTag,
};
