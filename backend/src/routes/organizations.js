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
   GET all organizations (JOIN category + member count + head user)
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

        o.head_user_id,

        -- Derived fields for frontend
        CONCAT(u.first_name, ' ', u.last_name) AS head_user_name,
        u.email AS head_user_email,

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

      LEFT JOIN users u 
        ON u.user_id = o.head_user_id

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
      head_user_id,
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

    // CREATE ORGANIZATION
    const [result] = await db.query(
      `
      INSERT INTO organizations
      (title, description, location, hours, contact, website,
       head_user_id, category_id, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        title,
        description || null,
        location || null,
        hours || null,
        contact || null,
        website || null,
        head_user_id || null,
        category_id,
        created_by,
      ]
    );

    const orgId = result.insertId;

    /* ============================================================
       Automatically add MEMBERSHIPS
    ============================================================ */

    // Add HEAD as role='head'
    if (head_user_id) {
      await db.query(
        `
        INSERT IGNORE INTO organization_members (org_id, user_id, role)
        VALUES (?, ?, 'head')
        `,
        [orgId, head_user_id]
      );
    }

    // Add ADMIN (creator) as role='admin'
    await db.query(
      `
      INSERT IGNORE INTO organization_members (org_id, user_id, role)
      VALUES (?, ?, 'admin')
      `,
      [orgId, created_by]
    );

    return res.status(201).json({
      message: "Organization created",
      org_id: orgId,
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
      head_user_id,
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
        head_user_id = ?,
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
        head_user_id || null,
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

/* ============================================================
   GET all members of an organization
============================================================ */
router.get("/:id/members", async (req, res) => {
  try {
    const orgId = req.params.id;

    const [rows] = await db.query(
      `
      SELECT 
        u.user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.bio,
        om.role AS org_role,
        r.role_name AS user_role
      FROM organization_members om
      JOIN users u ON u.user_id = om.user_id
      JOIN roles r ON r.role_id = u.role_id
      WHERE om.org_id = ?
      ORDER BY 
        FIELD(om.role, 'head', 'admin', 'advisor', 'member'),
        u.first_name, u.last_name
      `,
      [orgId]
    );

    return res.json(rows);
  } catch (err) {
    console.error("GET org members error:", err);
    res.status(500).json({ message: "Failed to load members" });
  }
});


module.exports = router;
