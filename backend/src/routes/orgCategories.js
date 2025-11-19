const express = require("express");
const router = express.Router();
const db = require("../config/db");

// GET all organization categories
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT category_id, category_key, category_name
      FROM organization_categories
      ORDER BY category_name;
    `);

    res.json(rows);
  } catch (err) {
    console.error("GET /org-categories error:", err);
    res.status(500).json({ message: "Failed to load categories" });
  }
});

module.exports = router;
