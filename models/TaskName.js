const mongoose = require("mongoose");

const TaskNameSchema = new mongoose.Schema({
  page: {
    type: String,
    required: true,
  },
  taskName: {
    type: String,
    required: true,
  },
});

const TaskName = mongoose.model("TaskName", TaskNameSchema);

module.exports = TaskName;
