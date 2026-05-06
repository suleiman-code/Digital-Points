const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
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
    required: true,
    lowercase: true,
    trim: true
  },
  user_phone: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: "received"
  },
  viewed: {
    type: Boolean,
    default: false
  },
  replied_at: {
    type: Date,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Booking", BookingSchema);
