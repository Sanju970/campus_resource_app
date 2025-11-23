const express = require("express");
const router = express.Router();
const db = require("../config/db");

/* ============================================================
   Helper functions
============================================================ */

// Global role: 'student' | 'faculty' | 'admin'
async function getUserGlobalRole(userId) {
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

// Org role: 'member' | 'coordinator' | 'event_manager' | 'lead_faculty' | 'admin_delegate'
async function getOrgUserRole(orgId, userId) {
  const [rows] = await db.query(
    `
      SELECT role
      FROM organization_members
      WHERE org_id = ? AND user_id = ?
    `,
    [orgId, userId]
  );
  return rows[0]?.role || null;
}

async function getAuthContext(orgId, userId) {
  const globalRole = await getUserGlobalRole(userId);
  let orgRole = null;
  if (orgId) {
    orgRole = await getOrgUserRole(orgId, userId);
  }
  return { globalRole, orgRole };
}

function isGlobalAdmin(globalRole) {
  return globalRole === "admin";
}

// Small helper to validate org-role enum
const ORG_ROLES = [
  "member",
  "coordinator",
  "event_manager",
  "lead_faculty",
  "admin_delegate",
];
const BASIC_ORG_ROLES = ["member", "coordinator", "event_manager"];

/* ============================================================
   GET all organizations
   - joins category + member count
   - flags is_member & is_org_admin (delegate/lead_faculty)
============================================================ */
/* ============================================================
   GET all organizations
   - returns user role in org + role counts
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

        -- NEW: user's exact org role
        (
          SELECT role
          FROM organization_members om
          WHERE om.org_id = o.org_id AND om.user_id = ?
        ) AS current_org_role,

        -- NEW: count of admin_delegate
        (
          SELECT COUNT(*)
          FROM organization_members 
          WHERE org_id = o.org_id AND role = 'admin_delegate'
        ) AS admin_delegate_count,

        -- NEW: count of lead_faculty
        (
          SELECT COUNT(*)
          FROM organization_members 
          WHERE org_id = o.org_id AND role = 'lead_faculty'
        ) AS lead_faculty_count,

        -- Keep your old is_org_admin flag for compatibility
        CASE
          WHEN ? IS NULL THEN 0
          ELSE (
            SELECT COUNT(*)
            FROM organization_members om2
            WHERE om2.org_id = o.org_id
              AND om2.user_id = ?
              AND om2.role IN ('admin_delegate','lead_faculty')
          )
        END AS is_org_admin

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
      [userId, userId, userId, userId, userId, userId]
    );

    res.json(rows);
  } catch (err) {
    console.error("GET /organizations error:", err);
    res.status(500).json({ message: "Failed to load organizations" });
  }
});

/* ============================================================
   CREATE organization (GLOBAL ADMIN only)
   - Creator becomes admin_delegate in org_members
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
      category_id,
      created_by,
    } = req.body;

    if (!title || !created_by || !category_id) {
      return res.status(400).json({
        message: "Title, category_id, and created_by are required",
      });
    }

    const globalRole = await getUserGlobalRole(created_by);
    if (!isGlobalAdmin(globalRole)) {
      return res.status(403).json({
        message: "Only global admins can create organizations",
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO organizations
      (title, description, location, hours, contact, website, category_id, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        title,
        description || null,
        location || null,
        hours || null,
        contact || null,
        website || null,
        category_id,
        created_by,
      ]
    );

    const orgId = result.insertId;

    // Creator is org-level admin_delegate
    await db.query(
      `
      INSERT IGNORE INTO organization_members (org_id, user_id, role)
      VALUES (?, ?, 'admin_delegate')
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
   UPDATE organization
   - Global admin: always
   - Org-level: admin_delegate or lead_faculty
============================================================ */
router.put("/:id", async (req, res) => {
  try {
    const orgId = Number(req.params.id);
    const {
      title,
      description,
      location,
      hours,
      contact,
      website,
      category_id,
      updated_by,
    } = req.body;

    if (!updated_by) {
      return res.status(400).json({ message: "updated_by is required" });
    }

    const { globalRole, orgRole } = await getAuthContext(orgId, updated_by);
    const isGlobal = isGlobalAdmin(globalRole);
    const canOrgEdit =
      orgRole === "admin_delegate" || orgRole === "lead_faculty";

    if (!isGlobal && !canOrgEdit) {
      return res.status(403).json({
        message:
          "Only a global admin or this organization's admin_delegate/lead_faculty can update it",
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
   DELETE organization 
   - ONLY global admin
============================================================ */
router.delete("/:id", async (req, res) => {
  try {
    const orgId = Number(req.params.id);
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: "user_id is required" });
    }

    const globalRole = await getUserGlobalRole(user_id);
    if (!isGlobalAdmin(globalRole)) {
      return res.status(403).json({
        message: "Only a global admin can delete organizations",
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
   - Inserts as role='member'
============================================================ */
router.post("/:id/join", async (req, res) => {
  try {
    const orgId = Number(req.params.id);
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
   - admin_delegate: cannot leave (must transfer first)
   - others: can leave
============================================================ */
/* ============================================================
   LEAVE organization
   - User cannot leave if they are:
       1. The ONLY admin_delegate
       2. The ONLY lead_faculty
============================================================ */
router.post("/:id/leave", async (req, res) => {
  try {
    const orgId = Number(req.params.id);
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: "user_id is required" });
    }

    // Get the user's current org role
    const [[memberRow]] = await db.query(
      `
      SELECT role 
      FROM organization_members
      WHERE org_id = ? AND user_id = ?
      `,
      [orgId, user_id]
    );

    if (!memberRow) {
      return res.status(400).json({
        message: "You are not a member of this organization.",
      });
    }

    const role = memberRow.role;

    /* =================================================================
       CHECK IF THEY ARE THE **ONLY** admin_delegate
       ================================================================= */
    if (role === "admin_delegate") {
      const [[countRow]] = await db.query(
        `
        SELECT COUNT(*) AS count
        FROM organization_members
        WHERE org_id = ? AND role = 'admin_delegate'
        `,
        [orgId]
      );

      if (countRow.count <= 1) {
        return res.status(403).json({
          message:
            "You are the only admin_delegate. Transfer admin rights before leaving.",
        });
      }
    }

    /* =================================================================
       CHECK IF THEY ARE THE **ONLY** lead_faculty
       ================================================================= */
    if (role === "lead_faculty") {
      const [[countRow]] = await db.query(
        `
        SELECT COUNT(*) AS count
        FROM organization_members
        WHERE org_id = ? AND role = 'lead_faculty'
        `,
        [orgId]
      );

      if (countRow.count <= 1) {
        return res.status(403).json({
          message:
            "You are the only lead_faculty. Assign your role to another faculty member before leaving.",
        });
      }
    }

    /* =================================================================
       SAFE TO LEAVE → DELETE MEMBERSHIP
       ================================================================= */
    await db.query(
      `
      DELETE FROM organization_members
      WHERE org_id = ? AND user_id = ?
      `,
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
    const orgId = Number(req.params.id);

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
        FIELD(om.role, 'admin_delegate', 'lead_faculty', 'event_manager', 'coordinator', 'member'),
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

/* ============================================================
   ADD member
   - global admin: always
   - org roles allowed: admin_delegate, lead_faculty, event_manager, coordinator
============================================================ */
router.post("/:id/members/add", async (req, res) => {
  try {
    const orgId = Number(req.params.id);
    const { acting_user_id, new_user_id } = req.body;

    if (!acting_user_id || !new_user_id) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const { globalRole, orgRole } = await getAuthContext(orgId, acting_user_id);
    const canAdd =
      isGlobalAdmin(globalRole) ||
      ["admin_delegate", "lead_faculty", "event_manager", "coordinator"].includes(
        orgRole
      );

    if (!canAdd) {
      return res.status(403).json({
        message: "You are not allowed to add members to this organization.",
      });
    }

    const [exists] = await db.query(
      `
      SELECT role 
      FROM organization_members 
      WHERE org_id = ? AND user_id = ?
      `,
      [orgId, new_user_id]
    );

    if (exists.length > 0) {
      return res.status(400).json({
        message: "This user is already a member of this organization",
      });
    }

    await db.query(
      `
      INSERT INTO organization_members (org_id, user_id, role)
      VALUES (?, ?, 'member')
      `,
      [orgId, new_user_id]
    );

    return res.json({ message: "Member added successfully" });
  } catch (err) {
    console.error("Add member error:", err);
    res.status(500).json({ message: "Failed to add member" });
  }
});

/* ============================================================
   REMOVE member
   - global admin: can remove anyone
   - admin_delegate: can remove anyone EXCEPT other admin_delegate
   - lead_faculty: can remove member/coordinator/event_manager
============================================================ */
router.post("/:id/members/remove", async (req, res) => {
  try {
    const orgId = Number(req.params.id);
    const { acting_user_id, remove_user_id } = req.body;

    if (!acting_user_id || !remove_user_id) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Acting user's privileges
    const { globalRole, orgRole } = await getAuthContext(orgId, acting_user_id);
    const isGlobal = isGlobalAdmin(globalRole);

    // Target member's current org role
    const [targetRows] = await db.query(
      `
      SELECT role 
      FROM organization_members 
      WHERE org_id = ? AND user_id = ?
      `,
      [orgId, remove_user_id]
    );

    if (!targetRows.length) {
      return res.status(400).json({ message: "User is not a member" });
    }

    const targetRole = targetRows[0].role;

    /* ============================================================
       SPECIAL CASE: Removing YOURSELF
       ============================================================ */

    // Case 1: lead_faculty removing themselves
    if (acting_user_id === remove_user_id && orgRole === "lead_faculty") {
      const [[countRow]] = await db.query(
        `SELECT COUNT(*) AS count 
         FROM organization_members 
         WHERE org_id = ? AND role = 'lead_faculty'`,
        [orgId]
      );

      if (countRow.count <= 1) {
        return res.status(403).json({
          message:
            "You are the only lead_faculty. Assign your role before leaving.",
        });
      }

      // Safe to leave
      await db.query(
        `
        DELETE FROM organization_members 
        WHERE org_id = ? AND user_id = ?
        `,
        [orgId, remove_user_id]
      );

      return res.json({ message: "You have left the organization." });
    }

    // Case 2: admin_delegate removing themselves
    if (acting_user_id === remove_user_id && orgRole === "admin_delegate") {
      const [[countRow]] = await db.query(
        `SELECT COUNT(*) AS count 
         FROM organization_members 
         WHERE org_id = ? AND role = 'admin_delegate'`,
        [orgId]
      );

      if (countRow.count <= 1) {
        return res.status(403).json({
          message:
            "You are the only admin_delegate. Transfer admin_delegate rights before leaving.",
        });
      }

      // Safe to leave
      await db.query(
        `
        DELETE FROM organization_members 
        WHERE org_id = ? AND user_id = ?
        `,
        [orgId, remove_user_id]
      );

      return res.json({ message: "You have left the organization." });
    }

    /* ============================================================
       NORMAL REMOVE LOGIC
       ============================================================ */
    let canRemove = false;

    if (isGlobal) {
      canRemove = true;
    } else if (orgRole === "admin_delegate") {
      canRemove = targetRole !== "admin_delegate";
    } else if (orgRole === "lead_faculty") {
      canRemove = ["member", "coordinator", "event_manager"].includes(
        targetRole
      );
    }

    if (!canRemove) {
      return res.status(403).json({
        message: "You are not allowed to remove this member.",
      });
    }

    // Remove normally
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
   UPDATE member ROLE
   - global admin: any role
   - admin_delegate: any role
   - lead_faculty:
       * cannot modify admin_delegate
       * cannot assign admin_delegate
   - event_manager/coordinator:
       * can only change member/coordinator/event_manager
============================================================ */
router.put("/:id/members/:memberId/role", async (req, res) => {
  try {
    const orgId = Number(req.params.id);
    const memberId = Number(req.params.memberId);
    const { acting_user_id, new_role } = req.body;

    if (!acting_user_id || !new_role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!ORG_ROLES.includes(new_role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Get acting user's privileges
    const { globalRole, orgRole } = await getAuthContext(orgId, acting_user_id);
    const isGlobal = isGlobalAdmin(globalRole);

    // Get target's current org role
    const [targetRows] = await db.query(
      `SELECT role FROM organization_members WHERE org_id = ? AND user_id = ?`,
      [orgId, memberId]
    );
    if (!targetRows.length) {
      return res.status(400).json({ message: "User is not a member" });
    }
    const currentRole = targetRows[0].role;

    // ❗ NEW: GET TARGET'S GLOBAL ROLE (faculty/admin/student)
    const [[userRow]] = await db.query(
      `SELECT role_id FROM users WHERE user_id = ?`,
      [memberId]
    );

    if (!userRow) {
      return res.status(400).json({ message: "Target user not found" });
    }

    const targetGlobalRoleId = userRow.role_id; // 1=student, 2=faculty, 3=admin

    /*
      NEW VALIDATION RULES
      ---------------------
      admin_delegate    → ONLY user with role_id=3
      lead_faculty      → ONLY role_id=2 or 3
      others            → anyone
    */

    if (new_role === "admin_delegate" && targetGlobalRoleId !== 3) {
      return res.status(400).json({
        message: "admin_delegate cannot be assigned to faculty/students.",
      });
    }

    if (new_role === "lead_faculty" && ![2, 3].includes(targetGlobalRoleId)) {
      return res.status(400).json({
        message:
          "lead_faculty can only be assigned to global admins or faculty users.",
      });
    }

    // Now check if the ACTING USER is allowed to assign it
    let allowed = false;

    if (isGlobal || orgRole === "admin_delegate") {
      allowed = true;
    } else if (orgRole === "lead_faculty") {
      if (currentRole === "admin_delegate" || new_role === "admin_delegate") {
        allowed = false;
      } else {
        allowed = true;
      }
    } else if (["event_manager", "coordinator"].includes(orgRole)) {
      if (
        BASIC_ORG_ROLES.includes(currentRole) &&
        BASIC_ORG_ROLES.includes(new_role)
      ) {
        allowed = true;
      }
    }

    if (!allowed) {
      return res.status(403).json({
        message: "You are not allowed to change this member's role.",
      });
    }

    // Update role
    await db.query(
      `
      UPDATE organization_members
      SET role = ?
      WHERE org_id = ? AND user_id = ?
      `,
      [new_role, orgId, memberId]
    );

    return res.json({ message: "Role updated successfully" });

  } catch (err) {
    console.error("Update role error:", err);
    res.status(500).json({ message: "Failed to update member role" });
  }
});


/* ============================================================
   TRANSFER admin_delegate
   - global admin OR current admin_delegate
   - new_admin_id must be a GLOBAL admin user
============================================================ */
router.post("/:id/transfer-admin", async (req, res) => {
  try {
    const orgId = Number(req.params.id);
    const { acting_user_id, new_admin_id } = req.body;

    if (!acting_user_id || !new_admin_id) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const { globalRole, orgRole } = await getAuthContext(orgId, acting_user_id);
    const isGlobal = isGlobalAdmin(globalRole);

    if (!isGlobal && orgRole !== "admin_delegate") {
      return res.status(403).json({
        message:
          "Only the organization's admin_delegate or a global admin can transfer admin rights",
      });
    }

    const [candidateRows] = await db.query(
      `SELECT role_id FROM users WHERE user_id = ?`,
      [new_admin_id]
    );

    if (!candidateRows.length || candidateRows[0].role_id !== 3) {
      return res.status(400).json({
        message: "Selected user must be a global admin (admXXXX).",
      });
    }

    await db.query(
      `
      INSERT INTO organization_members (org_id, user_id, role)
      VALUES (?, ?, 'admin_delegate')
      ON DUPLICATE KEY UPDATE role='admin_delegate'
      `,
      [orgId, new_admin_id]
    );

    if (!isGlobal) {
      await db.query(
        `
        UPDATE organization_members
        SET role='member'
        WHERE org_id=? AND user_id=? AND role='admin_delegate'
        `,
        [orgId, acting_user_id]
      );
    }

    return res.json({ message: "Admin_delegate role transferred successfully" });
  } catch (err) {
    console.error("TRANSFER ADMIN error:", err);
    res.status(500).json({ message: "Failed to transfer admin_delegate" });
  }
});

/* ============================================================
   GET all global admins (role_id = 3)
============================================================ */
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

/* ============================================================
   ORG DASHBOARD STATS
============================================================ */
router.get("/dashboard", async (req, res) => {
  try {
    const userId = req.query.user_id;

    const [[userRoleRow]] = await db.query(
      `
      SELECT r.role_name
      FROM users u
      JOIN roles r ON r.role_id = u.role_id
      WHERE u.user_id = ?
      `,
      [userId]
    );

    const role = userRoleRow?.role_name || null;

    const [[total]] = await db.query(`
      SELECT COUNT(*) AS total_orgs FROM organizations WHERE is_active = 1
    `);

    const [[created]] = await db.query(
      `
      SELECT COUNT(*) AS orgs_created
      FROM organizations
      WHERE created_by = ?
      `,
      [userId]
    );

    const [[joined]] = await db.query(
      `
      SELECT COUNT(*) AS orgs_joined
      FROM organization_members
      WHERE user_id = ? AND role = 'member'
      `,
      [userId]
    );

    let adminOf = 0;

    if (role === "admin") {
      const [[adminRes]] = await db.query(
        `
        SELECT COUNT(*) AS admin_of
        FROM organization_members
        WHERE user_id = ? AND role = 'admin_delegate'
        `,
        [userId]
      );
      adminOf = adminRes.admin_of;
    } else if (role === "faculty") {
      const [[headRes]] = await db.query(
        `
        SELECT COUNT(*) AS admin_of
        FROM organization_members
        WHERE user_id = ? AND role = 'lead_faculty'
        `,
        [userId]
      );
      adminOf = headRes.admin_of;
    } else {
      const [[mgrRes]] = await db.query(
        `
        SELECT COUNT(*) AS admin_of
        FROM organization_members
        WHERE user_id = ? AND role IN ('coordinator','event_manager')
        `,
        [userId]
      );
      adminOf = mgrRes.admin_of;
    }

    res.json({
      total_orgs: total.total_orgs,
      orgs_created: created.orgs_created,
      orgs_joined: joined.orgs_joined,
      admin_of: adminOf,
    });
  } catch (err) {
    console.error("GET /organizations/dashboard error:", err);
    res.status(500).json({ message: "Failed to load dashboard" });
  }
});

/* ============================================================
   GET Mutual Organizations Between Two Users
   viewerId = logged-in user
   profileId = profile you are viewing
============================================================ */
router.get("/mutual-orgs/:viewerId/:profileId", async (req, res) => {
  const { viewerId, profileId } = req.params;

  try {
    const [rows] = await db.query(
      `
      SELECT 
        o.org_id AS id,
        o.title
      FROM organization_members m1
      JOIN organization_members m2
        ON m1.org_id = m2.org_id
      JOIN organizations o 
        ON o.org_id = m1.org_id
      WHERE m1.user_id = ? 
        AND m2.user_id = ?
        AND o.is_active = 1
      ORDER BY o.title
      `,
      [viewerId, profileId]
    );

    res.json(rows);
  } catch (err) {
    console.error("Mutual organizations error:", err);
    res.status(500).json({ message: "Error loading mutual organizations" });
  }
});


module.exports = router;
