const mongoose = require("mongoose");
const dotenv = require("dotenv");
const dns = require("dns");

dotenv.config();

const connectDB = async () => {
  try {
    const mongoURI = String(process.env.MONGODB_URL || "").trim();

    if (!mongoURI) {
      throw new Error("MONGODB_URL is not defined in environment variables");
    }

    // Helpful for networks where default DNS resolvers block SRV lookups.
    const dnsServers = String(process.env.MONGODB_DNS_SERVERS || "8.8.8.8,1.1.1.1")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (dnsServers.length > 0) {
      dns.setServers(dnsServers);
      console.log(`Using DNS servers for MongoDB: ${dnsServers.join(", ")}`);
    }

    await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 15000 });
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
