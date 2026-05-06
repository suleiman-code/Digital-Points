const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
  service_id: {
    type: String,
    required: true
  },
  service_name: {
    type: String,
    default: ""
  },
  user_name: {
    type: String,
    required: true,
    trim: true
  },
  user_email: {
    type: String,
    lowercase: true,
    trim: true,
    default: ""
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  viewed: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Review", ReviewSchema);
