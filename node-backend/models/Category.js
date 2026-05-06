const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ""
  },
  icon: {
    type: String,
    default: ""
  }
});

module.exports = mongoose.model("Category", CategorySchema);
