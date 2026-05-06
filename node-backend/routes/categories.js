const express = require("express");
const Category = require("../models/Category");
const Service = require("../models/Service");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 });
    return res.json(categories);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch categories" });
  }
});

router.get("/stats", requireAuth, requireAdmin, async (req, res) => {
  try {
    const totalCategories = await Category.countDocuments();
    const activeCategoryNames = await Service.distinct("category");

    return res.json({
      total_categories: totalCategories,
      active_categories: activeCategoryNames.length
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch category stats" });
  }
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, description = "", icon = "" } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const existing = await Category.findOne({ name: { $regex: `^${name.trim()}$`, $options: "i" } });
    if (existing) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = await Category.create({
      name: name.trim(),
      description,
      icon
    });

    return res.status(201).json(category);
  } catch (error) {
    return res.status(500).json({ message: "Failed to create category" });
  }
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Category not found" });
    }
    return res.status(204).send();
  } catch (error) {
    return res.status(400).json({ message: "Invalid category id" });
  }
});

module.exports = router;
