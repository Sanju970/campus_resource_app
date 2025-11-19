const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Fetch faculty users
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT user_id, first_name, last_name, email
      FROM users 
      JOIN roles ON roles.role_id = users.role_id
      WHERE roles.role_name = 'faculty'
      ORDER BY first_name, last_name;
    `);

    res.json(rows);
  } catch (err) {
    console.error("GET /faculty error:", err);
    res.status(500).json({ message: "Failed to load faculty" });
  }
});

module.exports = router;
