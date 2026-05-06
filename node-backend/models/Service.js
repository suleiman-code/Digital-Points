const mongoose = require("mongoose");

/**
 * Full listing shape — admin form sends many optional fields.
 * Without these paths + `featured`, Mongoose strict mode strips updates (pin/images/etc. never persist).
 */
const ServiceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      default: 0
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    country: {
      type: String,
      default: "USA",
      trim: true
    },
    featured: {
      type: Boolean,
      default: false
    },
    image_url: { type: String, default: "" },
    image: { type: String, default: "" },
    cover_image: { type: String, default: "" },
    gallery: { type: [String], default: [] },
    business_hours: { type: mongoose.Schema.Types.Mixed, default: {} },
    service_details: { type: String, default: "" },
    address: { type: String, default: "" },
    contact_phone: { type: String, default: "" },
    contact_email: { type: String, default: "" },
    website_url: { type: String, default: "" },
    google_maps_url: { type: String, default: "" },
    postal_code: { type: String, default: "" },
    video_url: { type: String, default: "" },
    image_zoom: { type: Number, default: 100 },
    image_position: { type: String, default: "center" },
    cover_zoom: { type: Number, default: 100 },
    cover_position: { type: String, default: "center" },
    avg_rating: {
      type: Number,
      default: 0
    },
    reviews_count: {
      type: Number,
      default: 0
    },
    created_at: {
      type: Date,
      default: Date.now
    },
    updated_at: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: false }
);

module.exports = mongoose.model("Service", ServiceSchema);
