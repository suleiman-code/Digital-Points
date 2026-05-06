const express = require("express");
const Service = require("../models/Service");
const Review = require("../models/Review");
const Contact = require("../models/Contact");
const Booking = require("../models/Booking");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();
const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

router.get("/", async (req, res) => {
  try {
    const { category, city, state, min_price, max_price, min_rating, page, limit } = req.query;
    const query = {};
    const pageNum = toPositiveInt(page, 1);
    const limitNum = Math.min(toPositiveInt(limit, 24), 60);
    const skip = (pageNum - 1) * limitNum;

    if (category) query.category = { $regex: `^${escapeRegex(String(category).trim())}$`, $options: "i" };
    if (city) query.city = { $regex: escapeRegex(String(city).trim()), $options: "i" };
    if (state) query.state = { $regex: escapeRegex(String(state).trim()), $options: "i" };

    if (min_price || max_price) {
      query.price = {};
      if (min_price) query.price.$gte = Number(min_price);
      if (max_price) query.price.$lte = Number(max_price);
    }

    if (min_rating) {
      query.avg_rating = { $gte: Number(min_rating) };
    }

    const projection = {
      title: 1,
      description: 1,
      category: 1,
      price: 1,
      city: 1,
      state: 1,
      country: 1,
      image_url: 1,
      image: 1,
      gallery: 1,
      avg_rating: 1,
      reviews_count: 1,
      featured: 1,
      created_at: 1,
      updated_at: 1
    };

    const [services, total] = await Promise.all([
      Service.find(query, projection)
        .sort({ featured: -1, created_at: -1, _id: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Service.countDocuments(query)
    ]);

    const optimized = services.map((item) => ({
      ...item,
      description: String(item.description || "").slice(0, 320)
    }));

    // Short cache for directory list improves repeat navigation speed.
    res.set("Cache-Control", "public, max-age=60");
    return res.json({
      items: optimized,
      total,
      page: pageNum,
      limit: limitNum,
      has_more: skip + optimized.length < total
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch services" });
  }
});

router.get("/dashboard/stats", requireAuth, requireAdmin, async (req, res) => {
  try {
    const [
      totalServices,
      totalBookings,
      totalCategories,
      totalContacts,
      pendingContacts,
      pendingReviews
    ] = await Promise.all([
      Service.countDocuments(),
      Booking.countDocuments(),
      require("../models/Category").countDocuments(),
      Contact.countDocuments(),
      Contact.countDocuments({ viewed: { $ne: true } }),
      Review.countDocuments({ status: "pending", viewed: { $ne: true } })
    ]);

    return res.json({
      total_services: totalServices,
      total_bookings: totalBookings,
      total_categories: totalCategories,
      total_contacts: totalContacts,
      pending_contacts: pendingContacts,
      pending_bookings: pendingContacts,
      pending_reviews: pendingReviews
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
});

router.get("/reviews/moderation/all", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status, days } = req.query;
    const query = {};

    if (status) {
      query.status = String(status).toLowerCase();
    }
    if (days && Number(days) > 0) {
      const cutoff = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
      query.created_at = { $gte: cutoff };
    }

    const reviews = await Review.find(query).sort({ created_at: -1 }).lean();
    return res.json(reviews);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch review moderation list" });
  }
});

router.put("/reviews/moderation/:review_id/status", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { review_id } = req.params;
    const { new_status } = req.query;
    const normalizedStatus = String(new_status || "").toLowerCase();

    if (!["pending", "approved", "rejected"].includes(normalizedStatus)) {
      return res.status(400).json({ message: "Status must be pending, approved, or rejected" });
    }

    const review = await Review.findById(review_id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.status = normalizedStatus;
    await review.save();

    const approvedReviews = await Review.find({
      service_id: review.service_id,
      status: "approved"
    });
    const count = approvedReviews.length;
    const avg = count > 0 ? approvedReviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / count : 0;

    await Service.findByIdAndUpdate(review.service_id, {
      avg_rating: Number(avg.toFixed(1)),
      reviews_count: count,
      updated_at: new Date()
    });

    return res.json(review);
  } catch (error) {
    return res.status(400).json({ message: "Invalid review id" });
  }
});

router.delete("/reviews/moderation/:review_id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const review = await Review.findById(req.params.review_id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (String(review.status).toLowerCase() !== "rejected") {
      return res.status(400).json({ message: "Only rejected reviews can be permanently deleted" });
    }

    await Review.findByIdAndDelete(req.params.review_id);
    return res.status(204).send();
  } catch (error) {
    return res.status(400).json({ message: "Invalid review id" });
  }
});

router.put("/reviews/moderation/:review_id/view", requireAuth, requireAdmin, async (req, res) => {
  try {
    await Review.findByIdAndUpdate(req.params.review_id, { viewed: true });
    return res.json({ message: "Review marked as viewed" });
  } catch (error) {
    return res.status(400).json({ message: "Invalid review id" });
  }
});

router.post("/upload", requireAuth, requireAdmin, upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Image file is required" });
  }
  return res.status(201).json({
    url: `/uploads/${req.file.filename}`
  });
});

router.get("/:id", async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).lean();
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }
    return res.json(service);
  } catch (error) {
    return res.status(400).json({ message: "Invalid service id" });
  }
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, description, category, price, city, state } = req.body;
    if (!title || !description || !category || !city || !state) {
      return res.status(400).json({ message: "title, description, category, city, and state are required" });
    }

    const service = await Service.create({
      title: String(title).trim(),
      description: String(description).trim(),
      category: String(category).trim(),
      price: Number(price || 0),
      city: String(city).trim(),
      state: String(state).trim(),
      avg_rating: 0,
      reviews_count: 0
    });

    return res.status(201).json(service);
  } catch (error) {
    return res.status(500).json({ message: "Failed to create service" });
  }
});

router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const updateData = { ...req.body, updated_at: new Date() };
    const service = await Service.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }
    return res.json(service);
  } catch (error) {
    return res.status(400).json({ message: "Invalid service id" });
  }
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const deleted = await Service.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Service not found" });
    }
    return res.status(204).send();
  } catch (error) {
    return res.status(400).json({ message: "Invalid service id" });
  }
});

router.post("/:id/reviews", async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    const { user_name, user_email = "", rating, comment } = req.body;
    if (!user_name || !rating || !comment) {
      return res.status(400).json({ message: "user_name, rating, and comment are required" });
    }

    const review = await Review.create({
      service_id: String(service._id),
      service_name: service.title,
      user_name: String(user_name).trim(),
      user_email: String(user_email || "").trim().toLowerCase(),
      rating: Number(rating),
      comment: String(comment).trim(),
      status: "pending"
    });

    const [allReviews, reviewedCount] = await Promise.all([
      Review.find({ service_id: String(service._id) }),
      Review.countDocuments({ service_id: String(service._id) })
    ]);

    const ratingTotal = allReviews.reduce((sum, item) => sum + Number(item.rating || 0), 0);
    const averageRating = reviewedCount > 0 ? ratingTotal / reviewedCount : 0;

    await Service.findByIdAndUpdate(service._id, {
      avg_rating: Number(averageRating.toFixed(1)),
      reviews_count: reviewedCount,
      updated_at: new Date()
    });

    return res.status(201).json(review);
  } catch (error) {
    return res.status(400).json({ message: "Invalid request for review creation" });
  }
});

router.get("/:id/reviews", async (req, res) => {
  try {
    const limitNum = Math.min(toPositiveInt(req.query.limit, 100), 200);
    const reviews = await Review.find({
      service_id: req.params.id,
      $or: [{ status: "approved" }, { status: { $exists: false } }]
    }).sort({ created_at: -1 }).limit(limitNum).lean();

    return res.json(reviews);
  } catch (error) {
    return res.status(400).json({ message: "Invalid service id" });
  }
});

module.exports = router;
