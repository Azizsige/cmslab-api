const mongoose = require("mongoose");

const PageAccessSchema = new mongoose.Schema({
  page: {
    type: String,
    required: true,
  },
  taskName: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TaskName",
    },
  ],
});

const PageAccess = mongoose.model("PageAccess", PageAccessSchema);

module.exports = PageAccess;
