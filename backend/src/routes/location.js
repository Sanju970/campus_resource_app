// backend/src/routes/location.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");

/* ============================================================
   Helper – check if user is global admin
============================================================ */
async function isGlobalAdmin(userId) {
  const [rows] = await db.query(
    `
      SELECT r.role_name
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      WHERE u.user_id = ?
    `,
    [userId]
  );

  return rows[0]?.role_name === "admin";
}

/* ============================================================
   1. GET ALL LOCATIONS
============================================================ */
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT location_id, location_name, building, room
      FROM campus_locations
      ORDER BY location_name
    `);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching locations:", err);
    res.status(500).json({ error: "Failed to fetch locations" });
  }
});

/* ============================================================
   2. GET AVAILABLE LOCATIONS (not assigned to orgs)
============================================================ */
router.get("/available", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT location_id, location_name, building, room
      FROM campus_locations
      WHERE location_id NOT IN (
        SELECT location_id FROM organizations WHERE location_id IS NOT NULL
      )
      ORDER BY location_name
    `);

    res.json(rows);
  } catch (err) {
    console.error("Error fetching available locations:", err);
    res.status(500).json({ error: "Failed to fetch available locations" });
  }
});

/* ============================================================
   3. CHECK ORGANIZATION LOCATION
============================================================ */
router.get("/check-org/:location_id", async (req, res) => {
  const { location_id } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT org_id, title FROM organizations WHERE location_id = ?`,
      [location_id]
    );

    if (rows.length > 0) {
      return res.json({
        available: false,
        used_by: rows[0].title,
      });
    }

    res.json({ available: true });
  } catch (err) {
    console.error("Error checking org location:", err);
    res.status(500).json({ error: "Failed to validate location" });
  }
});

/* ============================================================
   4. CHECK EVENT LOCATION OVERLAP
============================================================ */
router.post("/check-event", async (req, res) => {
  const { location_id, start_datetime, end_datetime, event_id } = req.body;

  try {
    let query = `
      SELECT event_id, title
      FROM events
      WHERE location_id = ?
      AND start_datetime < ?
      AND end_datetime > ?
    `;

    const params = [location_id, end_datetime, start_datetime];

    if (event_id) {
      query += " AND event_id != ?";
      params.push(event_id);
    }

    const [rows] = await db.query(query, params);

    if (rows.length > 0) {
      return res.json({
        available: false,
        conflict_with: rows[0].title,
      });
    }

    res.json({ available: true });
  } catch (err) {
    console.error("Error checking event location:", err);
    res.status(500).json({ error: "Failed to validate event location" });
  }
});

/* ============================================================
   5. ADD LOCATION (Global Admin only)
============================================================ */
router.post("/", async (req, res) => {
  try {
    const { user_id, location_name, building, room } = req.body;

    if (!location_name?.trim() || location_name.trim().length < 5) {
      return res.status(400).json({
        message: "Location name must be at least 5 letters",
      });
    }

    if (!building?.trim() || building.trim().length < 5) {
      return res.status(400).json({
        message: "Building name must be at least 5 letters",
      });
    }

    const roomNumber = Number(room);
    if (!room || isNaN(roomNumber) || roomNumber <= 0) {
      return res.status(400).json({
        message: "Room number must be a positive integer",
      });
    }

    if (!(await isGlobalAdmin(user_id))) {
      return res.status(403).json({ message: "Only global admins can add locations" });
    }

    await db.query(
      `INSERT INTO campus_locations (location_name, building, room)
       VALUES (?, ?, ?)`,
      [location_name.trim(), building.trim(), roomNumber]
    );

    res.json({ message: "Location added successfully" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Location already exists" });
    }
    console.error("Add location error:", err);
    res.status(500).json({ message: "Failed to add location" });
  }
});

/* ============================================================
   6. DELETE LOCATION (only if unused)
============================================================ */
router.delete("/:location_id", async (req, res) => {
  const { location_id } = req.params;
  const { user_id } = req.body;

  try {
    if (!(await isGlobalAdmin(user_id))) {
      return res.status(403).json({ message: "Only global admins can delete locations" });
    }

    // Check if an organization uses this location
    const [orgUse] = await db.query(
      `SELECT 1 FROM organizations WHERE location_id = ?`,
      [location_id]
    );

    if (orgUse.length > 0) {
      return res.status(400).json({
        message: "Cannot delete: Location is assigned to an organization",
      });
    }

    // Check if FUTURE or ONGOING events are using this location
    const [futureEvents] = await db.query(
      `
      SELECT event_id, title 
      FROM events 
      WHERE location_id = ? 
      AND end_datetime >= NOW()
      `,
      [location_id]
    );

    if (futureEvents.length > 0) {
      return res.status(400).json({
        message: `Cannot delete: Location has scheduled events (e.g., "${futureEvents[0].title}")`,
      });
    }

    await db.query(
      `
      UPDATE events 
      SET location_id = NULL
      WHERE location_id = ?
      AND end_datetime < NOW()
      `,
      [location_id]
    );

    // NOW delete the location
    await db.query(
      `DELETE FROM campus_locations WHERE location_id = ?`,
      [location_id]
    );

    res.json({ message: "Location deleted successfully" });
  } catch (err) {
    console.error("Delete location error:", err);
    return res.status(500).json({ message: "Failed to delete location" });
  }
});


/* ============================================================
   7. UPDATE LOCATION (Global Admin only)
============================================================ */
router.put("/:location_id", async (req, res) => {
  const { location_id } = req.params;
  const { user_id, location_name, building, room } = req.body;

  try {
    if (!location_name?.trim() || location_name.trim().length < 5) {
      return res.status(400).json({
        message: "Location name must be at least 5 letters",
      });
    }

    if (!building?.trim() || building.trim().length < 5) {
      return res.status(400).json({
        message: "Building name must be at least 5 letters",
      });
    }

    const roomNumber = Number(room);
    if (!room || isNaN(roomNumber) || roomNumber <= 0) {
      return res.status(400).json({
        message: "Room number must be a positive integer",
      });
    }

    if (!(await isGlobalAdmin(user_id))) {
      return res.status(403).json({
        message: "Only global admins can edit locations",
      });
    }

    const [dup] = await db.query(
      `
      SELECT location_id 
      FROM campus_locations 
      WHERE location_name = ? AND location_id != ?
      `,
      [location_name, location_id]
    );

    if (dup.length > 0) {
      return res.status(400).json({
        message: "Another location already exists with this name",
      });
    }

    const [orgUse] = await db.query(
      `SELECT 1 FROM organizations WHERE location_id = ?`,
      [location_id]
    );

    if (orgUse.length > 0) {
      return res.status(400).json({
        message: "Cannot edit: Location is assigned to an organization",
      });
    }

    const [futureEvts] = await db.query(
      `
      SELECT event_id, title
      FROM events
      WHERE location_id = ?
      AND end_datetime >= NOW()
      `,
      [location_id]
    );

    if (futureEvts.length > 0) {
      return res.status(400).json({
        message: `Cannot edit: This location is used by scheduled events (e.g., "${futureEvts[0].title}")`,
      });
    }

    await db.query(
      `
      UPDATE campus_locations
      SET location_name = ?, building = ?, room = ?
      WHERE location_id = ?
      `,
      [location_name.trim(), building.trim(), roomNumber, location_id]
    );

    return res.json({
      message: "Location updated successfully",
    });

  } catch (err) {
    console.error("Edit location error:", err);
    return res.status(500).json({
      message: "Failed to update location",
    });
  }
});


module.exports = router;
