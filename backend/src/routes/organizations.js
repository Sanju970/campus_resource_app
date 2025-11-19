const express = require("express");
const router = express.Router();
const db = require("../config/db");

/* ------------------------------------------------------------
   Helper: Get role_name for a user
------------------------------------------------------------ */
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
   GET all organizations (JOIN category + member count)
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
        o.head_name,
        o.head_contact,

        oc.category_key,
        oc.category_name,
        o.category_id,

        o.is_active,
        COALESCE(m.member_count, 0) AS member_count,

        CASE 
          WHEN ? IS NULL THEN 0
          ELSE (
            SELECT COUNT(*) 
            FROM organization_members om
            WHERE om.org_id = o.org_id AND om.user_id = ?
          )
        END AS is_member

      FROM organizations o
      LEFT JOIN organization_categories oc
        ON oc.category_id = o.category_id

      LEFT JOIN (
        SELECT org_id, COUNT(*) AS member_count
        FROM organization_members
        GROUP BY org_id
      ) m ON m.org_id = o.org_id

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
   CREATE organization (ADMIN ONLY)
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
      head_name,
      head_contact,
      category_id,
      created_by,
    } = req.body;

    if (!title || !created_by || !category_id) {
      return res.status(400).json({
        message: "Title, category_id, and created_by are required",
      });
    }

    const roleName = await getUserRoleName(created_by);
    if (roleName !== "admin") {
      return res.status(403).json({
        message: "Only admin can create organizations",
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO organizations
      (title, description, location, hours, contact, website,
       head_name, head_contact, category_id, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        title,
        description || null,
        location || null,
        hours || null,
        contact || null,
        website || null,
        head_name || null,
        head_contact || null,
        category_id,
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
   UPDATE organization (ADMIN ONLY)
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
      head_name,
      head_contact,
      category_id,
      updated_by,
    } = req.body;

    if (!updated_by) {
      return res.status(400).json({ message: "updated_by is required" });
    }

    const roleName = await getUserRoleName(updated_by);
    if (roleName !== "admin") {
      return res.status(403).json({
        message: "Only admin can update organizations",
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
        head_name = ?,
        head_contact = ?,
        category_id = ?
      WHERE org_id = ?
      `,
      [
        title,
        description || null,
        location || null,
        hours || null,
        contact || null,
        website || null,
        head_name || null,
        head_contact || null,
        category_id,
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

    await db.query(
      `UPDATE organizations SET is_active = 0 WHERE org_id = ?`,
      [orgId]
    );

    res.json({ message: "Organization removed" });
  } catch (err) {
    console.error("DELETE /organizations/:id error:", err);
    res.status(500).json({ message: "Failed to delete organization" });
  }
});

/* ============================================================
   JOIN organization
============================================================ */
router.post("/:id/join", async (req, res) => {
  try {
    const orgId = req.params.id;
    const { user_id } = req.body;

    if (!user_id)
      return res.status(400).json({ message: "user_id is required" });

    const [exists] = await db.query(
      `SELECT 1 FROM organization_members WHERE org_id = ? AND user_id = ?`,
      [orgId, user_id]
    );

    if (exists.length)
      return res.json({ message: "Already a member" });

    await db.query(
      `
      INSERT INTO organization_members (org_id, user_id, role)
      VALUES (?, ?, 'member')
      `,
      [orgId, user_id]
    );

    res.json({ message: "Joined organization" });
  } catch (err) {
    console.error("JOIN error:", err);
    res.status(500).json({ message: "Failed to join organization" });
  }
});

/* ============================================================
   LEAVE organization
============================================================ */
router.post("/:id/leave", async (req, res) => {
  try {
    const orgId = req.params.id;
    const { user_id } = req.body;

    await db.query(
      `DELETE FROM organization_members WHERE org_id = ? AND user_id = ?`,
      [orgId, user_id]
    );

    res.json({ message: "Left organization" });
  } catch (err) {
    console.error("LEAVE error:", err);
    res.status(500).json({ message: "Failed to leave organization" });
  }
});

module.exports = router;
