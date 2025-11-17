const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Helper: get role_name for a user_id
async function getUserRoleName(userId) {
  const [rows] = await db.query(
    `
      SELECT r.role_name
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      WHERE u.user_id = ?
    `,
    [userId]
  );
  return rows[0]?.role_name || null;
}

/* ============================================================
   GET all organizations (optionally with membership info)
   GET /api/organizations?user_id=123
============================================================ */
router.get("/", async (req, res) => {
  const userId = req.query.user_id || null;

  try {
    const [rows] = await db.query(
      `
      SELECT
        o.org_id AS id,
        o.title,
        o.description,
        o.location,
        o.hours,
        o.contact,
        o.website,
        o.image,
        o.head_name,
        o.head_contact,
        o.is_active,
        COALESCE(members.member_count, 0) AS member_count,
        CASE
          WHEN ? IS NULL THEN 0
          ELSE COALESCE((
            SELECT 1
            FROM organization_members om
            WHERE om.org_id = o.org_id AND om.user_id = ?
          ), 0)
        END AS is_member
      FROM organizations o
      LEFT JOIN (
        SELECT org_id, COUNT(*) AS member_count
        FROM organization_members
        GROUP BY org_id
      ) AS members ON members.org_id = o.org_id
      WHERE o.is_active = 1
      ORDER BY o.title;
    `,
      [userId, userId]
    );

    res.json(rows);
  } catch (err) {
    console.error("GET /organizations error:", err);
    res.status(500).json({ message: "Failed to load organizations" });
  }
});

/* ============================================================
   CREATE organization (faculty + admin ONLY)
   POST /api/organizations
============================================================ */
router.post("/", async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      hours,
      contact,
      website,
      image,
      head_name,
      head_contact,
      created_by,
    } = req.body;

    if (!title || !created_by) {
      return res.status(400).json({
        message: "Title and created_by (user_id) are required",
      });
    }

    const roleName = await getUserRoleName(created_by);
    if (!["faculty", "admin"].includes(roleName)) {
      return res.status(403).json({
        message: "Only faculty or admin can create organizations",
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO organizations
        (title, description, location, hours, contact, website, image,
         head_name, head_contact, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        title,
        description || null,
        location || null,
        hours || null,
        contact || null,
        website || null,
        image || null,
        head_name || null,
        head_contact || null,
        created_by,
      ]
    );

    res.status(201).json({
      message: "Organization created",
      org_id: result.insertId,
    });
  } catch (err) {
    console.error("POST /organizations error:", err);
    res.status(500).json({ message: "Failed to create organization" });
  }
});

/* ============================================================
   UPDATE organization (faculty + admin ONLY)
   PUT /api/organizations/:id
============================================================ */
router.put("/:id", async (req, res) => {
  try {
    const orgId = req.params.id;
    const {
      title,
      description,
      location,
      hours,
      contact,
      website,
      image,
      head_name,
      head_contact,
      updated_by,
    } = req.body;

    if (!updated_by) {
      return res.status(400).json({ message: "updated_by (user_id) is required" });
    }

    const roleName = await getUserRoleName(updated_by);
    if (!["faculty", "admin"].includes(roleName)) {
      return res.status(403).json({
        message: "Only faculty or admin can update organizations",
      });
    }

    await db.query(
      `
      UPDATE organizations
      SET
        title = ?,
        description = ?,
        location = ?,
        hours = ?,
        contact = ?,
        website = ?,
        image = ?,
        head_name = ?,
        head_contact = ?
      WHERE org_id = ?
    `,
      [
        title,
        description || null,
        location || null,
        hours || null,
        contact || null,
        website || null,
        image || null,
        head_name || null,
        head_contact || null,
        orgId,
      ]
    );

    res.json({ message: "Organization updated" });
  } catch (err) {
    console.error("PUT /organizations/:id error:", err);
    res.status(500).json({ message: "Failed to update organization" });
  }
});

/* ============================================================
   DELETE organization (ADMIN ONLY)
   DELETE /api/organizations/:id
============================================================ */
router.delete("/:id", async (req, res) => {
  try {
    const orgId = req.params.id;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: "user_id is required" });
    }

    const roleName = await getUserRoleName(user_id);
    if (roleName !== "admin") {
      return res.status(403).json({
        message: "Only admin can delete organizations",
      });
    }

    // Soft delete: mark inactive so records remain
    await db.query(
      "UPDATE organizations SET is_active = 0 WHERE org_id = ?",
      [orgId]
    );

    res.json({ message: "Organization removed" });
  } catch (err) {
    console.error("DELETE /organizations/:id error:", err);
    res.status(500).json({ message: "Failed to delete organization" });
  }
});

/* ============================================================
   JOIN organization (Students can join; others allowed too)
   POST /api/organizations/:id/join
============================================================ */
router.post("/:id/join", async (req, res) => {
  try {
    const orgId = req.params.id;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: "user_id is required" });
    }

    // Prevent duplicate membership
    const [existing] = await db.query(
      `
      SELECT 1
      FROM organization_members
      WHERE org_id = ? AND user_id = ?
    `,
      [orgId, user_id]
    );

    if (existing.length) {
      return res.status(200).json({ message: "Already a member" });
    }

    await db.query(
      `
      INSERT INTO organization_members (org_id, user_id, role)
      VALUES (?, ?, 'member')
    `,
      [orgId, user_id]
    );

    res.status(201).json({ message: "Joined organization" });
  } catch (err) {
    console.error("POST /organizations/:id/join error:", err);
    res.status(500).json({ message: "Failed to join organization" });
  }
});

module.exports = router;
