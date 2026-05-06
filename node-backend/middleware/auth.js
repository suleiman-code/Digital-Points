const jwt = require("jsonwebtoken");
const User = require("../models/User");

const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Authorization token is required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ email: decoded.sub }).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Invalid authentication token" });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Could not validate credentials" });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.is_admin !== true) {
    return res.status(403).json({ message: "Admin access required" });
  }
  return next();
};

module.exports = {
  requireAuth,
  requireAdmin
};
