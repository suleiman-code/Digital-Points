const express = require("express");
const Booking = require("../models/Booking");
const Service = require("../models/Service");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { sendBookingReply } = require("../utils/mailer");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const {
      service_id,
      service_name = "",
      user_name,
      user_email,
      user_phone,
      message
    } = req.body;

    if (!service_id || !user_name || !user_email || !user_phone || !message) {
      return res.status(400).json({ message: "service_id, user_name, user_email, user_phone, and message are required" });
    }

    const service = await Service.findById(service_id);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    const booking = await Booking.create({
      service_id: String(service._id),
      service_name: service_name || service.title || "",
      user_name: String(user_name).trim(),
      user_email: String(user_email).trim().toLowerCase(),
      user_phone: String(user_phone).trim(),
      message: String(message).trim(),
      status: "received",
      viewed: false
    });

    return res.status(201).json(booking);
  } catch (error) {
    return res.status(400).json({ message: "Invalid booking payload" });
  }
});

router.get("/", requireAuth, requireAdmin, async (req, res) => {
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

    const bookings = await Booking.find(query).sort({ created_at: -1 });
    return res.json(bookings);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch bookings" });
  }
});

router.post("/:id/reply", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: "Reply message is required" });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        status: "contacted",
        viewed: true,
        replied_at: new Date()
      },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    if (booking.user_email) {
      await sendBookingReply(booking.user_email, message);
    }

    return res.json({ message: "Reply sent successfully" });
  } catch (error) {
    return res.status(400).json({ message: "Invalid booking id" });
  }
});

router.put("/:id/status", requireAuth, requireAdmin, async (req, res) => {
  try {
    const validStatuses = ["received", "contacted", "completed", "cancelled"];
    const newStatus = String(req.query.new_status || "").toLowerCase();

    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({ message: `Invalid status. Choose from: ${validStatuses.join(", ")}` });
    }

    const booking = await Booking.findByIdAndUpdate(req.params.id, { status: newStatus }, { new: true });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    return res.json(booking);
  } catch (error) {
    return res.status(400).json({ message: "Invalid booking id" });
  }
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const deleted = await Booking.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Booking not found" });
    }
    return res.status(204).send();
  } catch (error) {
    return res.status(400).json({ message: "Invalid booking id" });
  }
});

router.put("/:id/view", requireAuth, requireAdmin, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, { viewed: true }, { new: true });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    return res.json({ message: "Booking marked as viewed" });
  } catch (error) {
    return res.status(400).json({ message: "Invalid booking id" });
  }
});

module.exports = router;
