const express = require("express");
const Contact = require("../models/Contact");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { sendContactReply } = require("../utils/mailer");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: "name, email, subject, and message are required" });
    }

    await Contact.create({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      subject: String(subject).trim(),
      message: String(message).trim(),
      viewed: false
    });

    return res.status(201).json({ message: "Contact message sent successfully to Admin" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to submit contact message" });
  }
});

router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { days } = req.query;
    const query = {};

    if (days && Number(days) > 0) {
      const cutoff = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
      query.created_at = { $gte: cutoff };
    }

    const contacts = await Contact.find(query).sort({ created_at: -1 });
    return res.json(contacts);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch contact inquiries" });
  }
});

router.put("/:id/view", requireAuth, requireAdmin, async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(req.params.id, { viewed: true }, { new: true });
    if (!contact) {
      return res.status(404).json({ message: "Inquiry not found" });
    }
    return res.json({ message: "Inquiry marked as viewed" });
  } catch (error) {
    return res.status(400).json({ message: "Invalid contact id" });
  }
});

router.post("/:id/reply", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: "Reply message is required" });
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      {
        viewed: true,
        replied_at: new Date()
      },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    if (contact.email) {
      await sendContactReply(contact.email, message);
    }

    return res.json({ message: "Reply sent successfully" });
  } catch (error) {
    return res.status(400).json({ message: "Invalid contact id" });
  }
});

module.exports = router;
