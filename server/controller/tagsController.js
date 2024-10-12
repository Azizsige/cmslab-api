const Tags = require("../models/Tags");

const createTag = async (req, res) => {
  try {
    const { namaTag } = req.body;

    // Cek apakah kategori sudah ada
    const existingTag = await Tags.findOne({ namaTag });
    if (existingTag) {
      await req.flash("error", `Kategori ${namaTag} sudah ada`);
      return res.redirect("/tags");
    }

    const tag = await Tags.create({
      namaTag,
    });

    res.redirect("/tags");
  } catch (error) {}
};

const getTag = async (req, res) => {
  // const success = req.flash("success");
  // const error = req.flash("error");
  // const success_delete = req.flash("success-delete");
  // let perPage = 5;
  // let page = req.query.page || 1;
  // let item_per_page = (page - 1) * perPage;
  // try {
  //   const tag = await Tags.aggregate([{ $sort: { updatedAt: -1 } }])
  //     .skip(perPage * page - perPage)
  //     .limit(perPage)
  //     .exec();
  //   console.log(page);
  //   const count = await Tags.countDocuments();
  //   res.render("layouts/tags", {
  //     tag,
  //     error,
  //     success,
  //     success_delete,
  //     current: page,
  //     pages: Math.ceil(count / perPage),
  //     item_per_page,
  //   });
  // } catch (error) {}
};

const deleteTag = async (req, res) => {
  const { id } = req.params;
  try {
    const tag = await Tags.findByIdAndDelete(id);

    await req.flash("success-delete", `${tag.namaTag} berhasil dihapus`);

    await res.redirect("/tags");
  } catch (error) {}
};

const getTagById = async (req, res) => {
  const error = req.flash("error");
  const { id } = req.params;
  try {
    const tag = await Tags.findById(id);
    res.render("layouts/tag/edit", {
      tag,
      error,
    });
  } catch (error) {}
};

const updateTag = async (req, res) => {
  const { id } = req.params;
  const { namaTag } = req.body;

  try {
    const existingTag = await Tags.findOne({ namaTag });
    if (existingTag) {
      await req.flash("error", `Kategori ${namaTag} sudah ada`);
      return res.redirect(`/tags/edit/${id}`);
    }

    const tag = await Tags.findByIdAndUpdate(
      id,
      {
        namaTag,
      },
      { new: true }
    );

    await req.flash("success", `Kategori ${namaTag} berhasil diubah`);
    await res.redirect("/tags");
  } catch (error) {}
};

module.exports = {
  createTag,
  getTag,
  deleteTag,
  getTagById,
  updateTag,
};
