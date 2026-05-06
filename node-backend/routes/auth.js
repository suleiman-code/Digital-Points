const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");
const { strictAuthLimiter } = require("../middleware/rateLimit");
const { sendPasswordResetEmail } = require("../utils/mailer");

const router = express.Router();

router.post("/signup", strictAuthLimiter, async (req, res) => {
  try {
    const { email, password, first_name, last_name, is_admin } = req.body;

    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const totalUsers = await User.countDocuments();

    const user = await User.create({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      is_admin: typeof is_admin === "boolean" ? is_admin : totalUsers === 0
    });

    return res.status(201).json({
      _id: user._id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      is_admin: user.is_admin,
      created_at: user.created_at
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error during signup" });
  }
});

router.post("/login", strictAuthLimiter, async (req, res) => {
  try {
    const email = String(req.body?.email || req.body?.username || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { sub: user.email, userId: user._id, is_admin: user.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: "30m" }
    );

    return res.json({
      access_token: token,
      token_type: "bearer"
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error during login" });
  }
});

router.post("/forgot-password", strictAuthLimiter, async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (user) {
      const token = jwt.sign(
        { sub: user.email, type: "password_reset" },
        process.env.JWT_SECRET,
        { expiresIn: "30m" }
      );
      await sendPasswordResetEmail(user.email, token);
    }

    return res.json({ message: "If this account exists, a reset link has been sent." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to process forgot password request" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  return res.json(req.user);
});

module.exports = router;
