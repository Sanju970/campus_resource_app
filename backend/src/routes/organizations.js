const express = require("express");
const router = express.Router();
const db = require("../config/db");

/* ------------------------------------------------------------
   Helper functions
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

async function isOrgManager(org_id, user_id) {
  const [rows] = await db.query(
    `
    SELECT role 
    FROM organization_members 
    WHERE org_id = ? AND user_id = ?
    `,
    [org_id, user_id]
  );

  if (rows.length === 0) return false;

  return rows[0].role === "admin" || rows[0].role === "head";
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

        CONCAT(u.first_name, ' ', u.last_name) AS head_user_name,
        u.email AS head_user_email,

        oc.category_key,
        oc.category_name,
        o.category_id,

        o.is_active,
        COALESCE(m.member_count, 0) AS member_count,

        -- is_member for this user
        CASE 
          WHEN ? IS NULL THEN 0
          ELSE (
            SELECT COUNT(*) 
            FROM organization_members om
            WHERE om.org_id = o.org_id AND om.user_id = ?
          )
        END AS is_member,

        -- is_org_admin/head for this user
        CASE
          WHEN ? IS NULL THEN 0
          ELSE (
            SELECT COUNT(*)
            FROM organization_members om2
            WHERE om2.org_id = o.org_id
              AND om2.user_id = ?
              AND om2.role IN ('admin', 'head')
          )
        END AS is_org_admin

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
      [userId, userId, userId, userId]
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

    // Only org admin/head can update this org
    const canManage = await isOrgManager(orgId, updated_by);
    if (!canManage) {
      return res.status(403).json({
        message: "Only this organization's admin/head can update it",
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

    const canManage = await isOrgManager(orgId, user_id);
    if (!canManage) {
      return res.status(403).json({
        message: "Only this organization's admin/head can delete it",
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
/* ============================================================
   LEAVE ORGANIZATION (cannot leave if last admin)
============================================================ */
router.post("/:id/leave", async (req, res) => {
  try {
    const orgId = req.params.id;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: "user_id is required" });
    }

    // Get this member's org role
    const [member] = await db.query(
      `SELECT role FROM organization_members WHERE org_id = ? AND user_id = ?`,
      [orgId, user_id]
    );

    if (!member.length) {
      return res.status(400).json({ message: "Not a member of this organization" });
    }

    const role = member[0].role;

    // If they are ADMIN, check how many admins exist
    if (role === "admin") {
      const [admins] = await db.query(
        `SELECT COUNT(*) AS admin_count 
         FROM organization_members 
         WHERE org_id = ? AND role = 'admin'`,
        [orgId]
      );

      // If only ONE admin → cannot leave
      if (admins[0].admin_count <= 1) {
        return res.status(403).json({
          message:
            "You are the ONLY admin of this organization. Transfer admin rights before leaving."
        });
      }
    }

    // If head → CANNOT leave at all
    if (role === "head") {
      return res.status(403).json({
        message: "The organization head cannot leave. Assign a new head via edit screen."
      });
    }

    // Safe to leave
    await db.query(
      `DELETE FROM organization_members WHERE org_id = ? AND user_id = ?`,
      [orgId, user_id]
    );

    return res.json({ message: "Left organization successfully" });

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
        u.is_active,
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


router.post("/:id/members/add", async (req, res) => {
  try {
    const orgId = req.params.id;
    const { acting_user_id, new_user_id } = req.body;

    if (!acting_user_id || !new_user_id) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Only head or admin can add
    if (!(await isOrgManager(orgId, acting_user_id))) {
      return res.status(403).json({
        message: "Only organization head or admin can add members",
      });
    }

    await db.query(
      `
      INSERT INTO organization_members (org_id, user_id, role)
      VALUES (?, ?, 'member')
      ON DUPLICATE KEY UPDATE role = VALUES(role)
      `,
      [orgId, new_user_id]
    );

    return res.json({ message: "Member added successfully" });

  } catch (err) {
    console.error("Add member error:", err);
    res.status(500).json({ message: "Failed to add member" });
  }
});

router.post("/:id/members/remove", async (req, res) => {
  try {
    const orgId = req.params.id;
    const { acting_user_id, remove_user_id } = req.body;

    if (!acting_user_id || !remove_user_id) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Only head or admin can remove
    if (!(await isOrgManager(orgId, acting_user_id))) {
      return res.status(403).json({
        message: "Only organization head or admin can remove members",
      });
    }

    // Prevent removing fellow admin or head accidentally
    const [roleCheck] = await db.query(
      `
      SELECT role FROM organization_members 
      WHERE org_id = ? AND user_id = ?
      `,
      [orgId, remove_user_id]
    );

    if (!roleCheck.length) {
      return res.status(400).json({ message: "User is not a member" });
    }

    if (roleCheck[0].role === "admin") {
      return res.status(403).json({ message: "Cannot remove another admin" });
    }

    if (roleCheck[0].role === "head") {
      return res.status(403).json({ message: "Cannot remove the head" });
    }

    await db.query(
      `
      DELETE FROM organization_members 
      WHERE org_id = ? AND user_id = ?
      `,
      [orgId, remove_user_id]
    );

    return res.json({ message: "Member removed successfully" });

  } catch (err) {
    console.error("Remove member error:", err);
    res.status(500).json({ message: "Failed to remove member" });
  }
});

/* ============================================================
   TRANSFER ADMIN ROLE (Only one valid endpoint)
============================================================ */
router.post("/:id/transfer-admin", async (req, res) => {
  try {
    const orgId = req.params.id;
    const { acting_user_id, new_admin_id } = req.body;

    if (!acting_user_id || !new_admin_id) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate acting user is current org admin
    const [current] = await db.query(
      `SELECT role FROM organization_members
       WHERE org_id = ? AND user_id = ?`,
      [orgId, acting_user_id]
    );

    if (!current.length || current[0].role !== "admin") {
      return res.status(403).json({
        message: "Only the current organization admin can transfer admin rights",
      });
    }

    // Validate new admin is a GLOBAL admin (admXXXX)
    const [candidate] = await db.query(
      `SELECT role_id FROM users WHERE user_id = ?`,
      [new_admin_id]
    );

    if (!candidate.length || candidate[0].role_id !== 3) {
      return res.status(400).json({
        message: "Selected user must be a global admin (admXXXX).",
      });
    }

    // Promote new admin
    await db.query(
      `
      INSERT INTO organization_members (org_id, user_id, role)
      VALUES (?, ?, 'admin')
      ON DUPLICATE KEY UPDATE role='admin'
      `,
      [orgId, new_admin_id]
    );

    // Demote old admin
    await db.query(
      `
      UPDATE organization_members
      SET role='member'
      WHERE org_id=? AND user_id=?
      `,
      [orgId, acting_user_id]
    );

    return res.json({ message: "Admin role transferred successfully" });

  } catch (err) {
    console.error("TRANSFER ADMIN error:", err);
    res.status(500).json({ message: "Failed to transfer admin" });
  }
});

// GET all global admins (role_id = 3)
router.get("/global-admins", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT user_id, first_name, last_name, email, user_uid
       FROM users
       WHERE role_id = 3 AND is_active = 1`
    );

    res.json(rows);
  } catch (err) {
    console.error("GET global admins error:", err);
    res.status(500).json({ message: "Failed to load admins" });
  }
});


module.exports = router;
