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

// Org-specific role
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

  if (orgId) orgRole = await getOrgUserRole(orgId, userId);
  return { globalRole, orgRole };
}

function isGlobalAdmin(role) {
  return role === "admin";
}

const ORG_ROLES = [
  "member",
  "coordinator",
  "event_manager",
  "lead_faculty",
  "admin_delegate",
];

const BASIC_ORG_ROLES = ["member", "coordinator", "event_manager"];
/* ================================
   SIMPLE HELPERS
================================== */
function isPositiveInt(value) {
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
}

/* ============================================================
   LOCATION VALIDATION HELPERS
============================================================ */

async function isLocationValid(location_id) {
  const [rows] = await db.query(
    `SELECT location_id FROM campus_locations WHERE location_id = ?`,
    [location_id]
  );
  return rows.length > 0;
}

async function isLocationTaken(location_id, orgId = null) {
  let q = `SELECT org_id FROM organizations WHERE location_id = ?`;
  const params = [location_id];

  if (orgId) {
    q += ` AND org_id != ?`;
    params.push(orgId);
  }

  const [rows] = await db.query(q, params);
  return rows.length > 0;
}

/* ============================================================
   GET all organizations
============================================================ */
router.get("/", async (req, res) => {
  const userId = req.query.user_id || null;

  if (userId !== null && !isPositiveInt(userId)) {
    return res.status(400).json({ message: "Invalid user id." });
  }

  try {
    const [rows] = await db.query(
      `
      SELECT
        o.org_id AS id,
        o.title,
        o.description,

        o.location_id,
        cl.location_name,
        cl.building,
        cl.room,

        o.hours,
        o.contact,
        o.website,
        oc.category_key,
        oc.category_name,
        o.category_id,
        o.is_active,

        COALESCE(m.member_count, 0) AS member_count,

        CASE WHEN ? IS NULL THEN 0
            ELSE (SELECT COUNT(*) FROM organization_members WHERE org_id = o.org_id AND user_id = ?)
        END AS is_member,

        (SELECT role FROM organization_members WHERE org_id = o.org_id AND user_id = ?) AS current_org_role,

        (SELECT COUNT(*) FROM organization_members WHERE org_id = o.org_id AND role = 'admin_delegate') AS admin_delegate_count,

        (SELECT COUNT(*) FROM organization_members WHERE org_id = o.org_id AND role = 'lead_faculty') AS lead_faculty_count,

        CASE WHEN ? IS NULL THEN 0 ELSE (
          SELECT COUNT(*)
          FROM organization_members om
          WHERE om.org_id = o.org_id
          AND om.user_id = ?
          AND om.role IN ('admin_delegate', 'lead_faculty')
        ) END AS is_org_admin

      FROM organizations o

      LEFT JOIN campus_locations cl
        ON cl.location_id = o.location_id

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
      [userId, userId, userId, userId, userId]
    );

    res.json(rows);
  } catch (err) {
    console.error("GET /organizations:", err);
    res.status(500).json({ message: "Failed to load organizations" });
  }
});


/* ============================================================
   CREATE organization (GLOBAL ADMIN ONLY)
============================================================ */

router.post("/", async (req, res) => {
  try {
    const {
      title,
      description,
      location_id,
      hours,
      contact,
      website,
      category_id,
      created_by,
    } = req.body;

    if (!title || !created_by || !category_id || !location_id) {
      return res.status(400).json({
        message: "Title, category_id, created_by, and location_id are required",
      });
    }
        const cleanTitle = title.trim();
    if (cleanTitle.length < 3) {
      return res.status(400).json({
        message: "Title must be at least 3 characters long",
      });
    }

    if (!isPositiveInt(created_by)) {
      return res.status(400).json({
        message: "created_by must be a valid user id",
      });
    }

    if (!isPositiveInt(category_id)) {
      return res.status(400).json({
        message: "category_id must be a valid number",
      });
    }

    const globalRole = await getUserGlobalRole(created_by);
    if (!isGlobalAdmin(globalRole)) {
      return res
        .status(403)
        .json({ message: "Only global admins can create organizations" });
    }

    if (!(await isLocationValid(location_id))) {
      return res.status(400).json({ message: "Invalid location_id" });
    }

    if (await isLocationTaken(location_id)) {
      return res
        .status(400)
        .json({ message: "Location is already used by another organization" });
    }

    const [result] = await db.query(
      `
      INSERT INTO organizations
      (title, description, location_id, hours, contact, website, category_id, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        title,
        description,
        location_id,
        hours,
        contact,
        website,
        category_id,
        created_by,
      ]
    );

    const orgId = result.insertId;

    await db.query(
      `INSERT INTO organization_members (org_id, user_id, role)
       VALUES (?, ?, 'admin_delegate')`,
      [orgId, created_by]
    );

    res.status(201).json({ message: "Organization created", org_id: orgId });
  } catch (err) {
    console.error("POST /organizations:", err);
    res.status(500).json({ message: "Failed to create organization" });
  }
});

/* ============================================================
   UPDATE organization
============================================================ */

router.put("/:id", async (req, res) => {
  try {
    const orgId = Number(req.params.id);

    const {
      title,
      description,
      location_id,
      hours,
      contact,
      website,
      category_id,
      updated_by,
    } = req.body;

    if (!updated_by){
      return res.status(400).json({ message: "updated_by is required" });
    }
        if (!isPositiveInt(orgId)) {
      return res.status(400).json({ message: "Invalid organization id" });
    }

    if (!title || !category_id) {
      return res.status(400).json({
        message: "Title and category_id are required",
      });
    }

    const cleanTitle = title.trim();
    if (cleanTitle.length < 3) {
      return res.status(400).json({
        message: "Title must be at least 3 characters long",
      });
    }

    if (!isPositiveInt(updated_by)) {
      return res.status(400).json({
        message: "updated_by must be a valid user id",
      });
    }

    if (!isPositiveInt(category_id)) {
      return res.status(400).json({
        message: "category_id must be a valid number",
      });
    }

    const { globalRole, orgRole } = await getAuthContext(orgId, updated_by);
    const canEdit =
      isGlobalAdmin(globalRole) ||
      ["admin_delegate", "lead_faculty"].includes(orgRole);

    if (!canEdit) {
      return res
        .status(403)
        .json({ message: "You are not allowed to update this organization" });
    }

    if (!(await isLocationValid(location_id))) {
      return res.status(400).json({ message: "Invalid location_id" });
    }

    if (await isLocationTaken(location_id, orgId)) {
      return res.status(400).json({
        message: "This location is already assigned to a different organization",
      });
    }

    await db.query(
      `
      UPDATE organizations
      SET title=?, description=?, location_id=?, hours=?, contact=?, website=?, category_id=?
      WHERE org_id=?
      `,
      [
        title,
        description,
        location_id,
        hours,
        contact,
        website,
        category_id,
        orgId,
      ]
    );

    res.json({ message: "Organization updated" });
  } catch (err) {
    console.error("PUT /organizations:", err);
    res.status(500).json({ message: "Failed to update organization" });
  }
});

/* ============================================================
   DELETE organization (GLOBAL ADMIN ONLY)
   - Soft delete the organization (is_active = 0)
   - Remove ALL members from organization_members
============================================================ */

router.delete("/:id", async (req, res) => {
  try {
    const { user_id } = req.body;
    const orgId = Number(req.params.id);

    if (!user_id) {
      return res.status(400).json({ message: "user_id is required" });
    }
    if (!isPositiveInt(orgId)) {
      return res.status(400).json({ message: "Invalid organization id" });
    }
    if (!isPositiveInt(user_id)) {
      return res
        .status(400)
        .json({ message: "user_id must be a valid user id" });
    }

    const globalRole = await getUserGlobalRole(user_id);

    if (!isGlobalAdmin(globalRole)) {
      return res
        .status(403)
        .json({ message: "Only a global admin can delete organizations" });
    }

    await db.query(
      `UPDATE organizations SET is_active = 0 WHERE org_id = ?`,
      [orgId]
    );

    await db.query(
      `DELETE FROM organization_members WHERE org_id = ?`,
      [orgId]
    );

    await db.query(
      `UPDATE organizations SET location_id = NULL WHERE org_id = ?`,
      [orgId]
    );

    return res.json({
      message: "Organization removed and all members unassigned",
    });
  } catch (err) {
    console.error("DELETE /organizations:", err);
    res.status(500).json({ message: "Failed to delete organization" });
  }
});


/* ============================================================
   JOIN ORGANIZATION
============================================================ */

router.post("/:id/join", async (req, res) => {
  try {
    const orgId = Number(req.params.id);
    const { user_id } = req.body;

    if (!user_id)
      return res.status(400).json({ message: "user_id is required" });

    if (!isPositiveInt(orgId)) {
      return res.status(400).json({ message: "Invalid organization id" });
    }

    if (!isPositiveInt(user_id)) {
      return res.status(400).json({ message: "user_id must be a valid user id" });
    }

    const [exists] = await db.query(
      `SELECT 1 FROM organization_members WHERE org_id=? AND user_id=?`,
      [orgId, user_id]
    );

    if (exists.length) return res.json({ message: "Already a member" });

    await db.query(
      `INSERT INTO organization_members (org_id, user_id, role) VALUES (?, ?, 'member')`,
      [orgId, user_id]
    );

    res.json({ message: "Joined organization" });
  } catch (err) {
    console.error("JOIN:", err);
    res.status(500).json({ message: "Failed to join organization" });
  }
});

/* ============================================================
   LEAVE ORGANIZATION (with role protection)
============================================================ */

router.post("/:id/leave", async (req, res) => {
  try {
    const orgId = Number(req.params.id);
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: "user_id is required" });
    }
    if (!isPositiveInt(orgId)) {
      return res.status(400).json({ message: "Invalid organization id" });
    }

    if (!isPositiveInt(user_id)) {
      return res.status(400).json({ message: "user_id must be a valid user id" });
    }

    // Get the user's current org role
    const [[row]] = await db.query(
      `SELECT role FROM organization_members WHERE org_id=? AND user_id=?`,
      [orgId, user_id]
    );

    if (!row) return res.status(400).json({ message: "Not a member" });

    const role = row.role;

    // prevent removing last admin_delegate
    if (role === "admin_delegate") {
      const [[count]] = await db.query(
        `SELECT COUNT(*) AS c FROM organization_members WHERE org_id=? AND role='admin_delegate'`,
        [orgId]
      );

      if (count.c <= 1) {
        return res.status(403).json({
          message: "Transfer admin_delegate role before leaving",
        });
      }
    }

    // prevent removing last lead_faculty
    if (role === "lead_faculty") {
      const [[count]] = await db.query(
        `SELECT COUNT(*) AS c FROM organization_members WHERE org_id=? AND role='lead_faculty'`,
        [orgId]
      );

      if (count.c <= 1) {
        return res
          .status(403)
          .json({ message: "Assign another lead_faculty before leaving" });
      }
    }

    await db.query(`DELETE FROM organization_members WHERE org_id=? AND user_id=?`, [
      orgId,
      user_id,
    ]);

    res.json({ message: "Left organization" });
  } catch (err) {
    console.error("LEAVE:", err);
    res.status(500).json({ message: "Failed to leave organization" });
  }
});

/* ============================================================
   GET MEMBERS OF ORGANIZATION
============================================================ */

router.get("/:id/members", async (req, res) => {
  try {
    const orgId = Number(req.params.id);
    if (!isPositiveInt(orgId)) {
      return res.status(400).json({ message: "Invalid organization id" });
    }


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
      ORDER BY FIELD(om.role, 'admin_delegate', 'lead_faculty', 'event_manager', 'coordinator', 'member'),
               u.first_name, u.last_name
      `,
      [orgId]
    );

    res.json(rows);
  } catch (err) {
    console.error("GET members:", err);
    res.status(500).json({ message: "Failed to load members" });
  }
});

/* ============================================================
   ADD MEMBER
============================================================ */

router.post("/:id/members/add", async (req, res) => {
  try {
    const orgId = Number(req.params.id);
    const { acting_user_id, new_user_id } = req.body;

    if (!acting_user_id || !new_user_id) {
      return res.status(400).json({ message: "Missing required fields" });
    }
        if (!isPositiveInt(orgId)) {
      return res.status(400).json({ message: "Invalid organization id" });
    }

    if (!isPositiveInt(acting_user_id) || !isPositiveInt(new_user_id)) {
      return res.status(400).json({ message: "Invalid user id(s)" });
    }

    const { globalRole, orgRole } = await getAuthContext(orgId, acting_user_id);
    const canAdd =
      isGlobalAdmin(globalRole) ||
      ["admin_delegate", "lead_faculty", "event_manager", "coordinator"].includes(
        orgRole
      );

    if (!canAdd) return res.status(403).json({ message: "Not allowed" });

    const [exists] = await db.query(
      `SELECT 1 FROM organization_members WHERE org_id=? AND user_id=?`,
      [orgId, new_user_id]
    );

    if (exists.length) {
      return res.status(400).json({ message: "User already a member" });
    }

    await db.query(
      `INSERT INTO organization_members (org_id, user_id, role) VALUES (?, ?, 'member')`,
      [orgId, new_user_id]
    );

    res.json({ message: "Member added" });
  } catch (err) {
    console.error("Add member:", err);
    res.status(500).json({ message: "Failed to add member" });
  }
});

/* ============================================================
   REMOVE MEMBER
============================================================ */

router.post("/:id/members/remove", async (req, res) => {
  try {
    const orgId = Number(req.params.id);
    const { acting_user_id, remove_user_id } = req.body;

    if (!acting_user_id || !remove_user_id) {
      return res.status(400).json({ message: "Missing required fields" });
    }
        if (!isPositiveInt(orgId)) {
      return res.status(400).json({ message: "Invalid organization id" });
    }

    if (!isPositiveInt(acting_user_id) || !isPositiveInt(remove_user_id)) {
      return res.status(400).json({ message: "Invalid user id(s)" });
    }


    // Acting user's privileges
    const { globalRole, orgRole } = await getAuthContext(orgId, acting_user_id);
    const isGlobal = isGlobalAdmin(globalRole);

    const [[target]] = await db.query(
      `SELECT role FROM organization_members WHERE org_id=? AND user_id=?`,
      [orgId, remove_user_id]
    );

    if (!target) return res.status(400).json({ message: "User is not a member" });

    const targetRole = target.role;

    let allowed = false;

    if (isGlobal) allowed = true;
    else if (orgRole === "admin_delegate") allowed = targetRole !== "admin_delegate";
    else if (orgRole === "lead_faculty") {
      allowed = ["member", "coordinator", "event_manager"].includes(targetRole);
    }
    // ❗ Prevent removing the LAST admin_delegate
    if (targetRole === "admin_delegate") {
      const [[count]] = await db.query(
        `SELECT COUNT(*) AS c
        FROM organization_members
        WHERE org_id = ? AND role = 'admin_delegate'`,
        [orgId]
      );

      if (count.c <= 1) {
        return res.status(403).json({
          message:
            "Cannot remove the only admin_delegate. Assign another admin_delegate first.",
        });
      }
    }

    if (!allowed) {
      return res.status(403).json({ message: "You cannot remove this member" });
    }

    await db.query(
      `DELETE FROM organization_members WHERE org_id=? AND user_id=?`,
      [orgId, remove_user_id]
    );

    res.json({ message: "Member removed" });
  } catch (err) {
    console.error("Remove member:", err);
    res.status(500).json({ message: "Failed to remove member" });
  }
});

/* ============================================================
   UPDATE MEMBER ROLE
============================================================ */

/* ============================================================
   UPDATE MEMBER ROLE  (FULL VALIDATION RESTORED)
============================================================ */
router.put("/:id/members/:memberId/role", async (req, res) => {
  try {
    const orgId = Number(req.params.id);
    const memberId = Number(req.params.memberId);
    const { acting_user_id, new_role } = req.body;

    if (!ORG_ROLES.includes(new_role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    if (!isPositiveInt(orgId) || !isPositiveInt(memberId)) {
      return res.status(400).json({ message: "Invalid organization or member id" });
    }

    if (!isPositiveInt(acting_user_id)) {
      return res.status(400).json({ message: "Invalid acting_user_id" });
    }


    const { globalRole, orgRole } = await getAuthContext(orgId, acting_user_id);
    const isGlobal = isGlobalAdmin(globalRole);

    // get target's current org role
    const [[target]] = await db.query(
      `SELECT role FROM organization_members WHERE org_id=? AND user_id=?`,
      [orgId, memberId]
    );

    if (!target) return res.status(400).json({ message: "User is not a member" });

    const currentRole = target.role;

    const [[g]] = await db.query(
      `SELECT role_id FROM users WHERE user_id=?`,
      [memberId]
    );

    if (!g) return res.status(400).json({ message: "Target user not found" });
    const targetGlobal = g.role_id;

    /* ============================================================
       STRONG VALIDATION RULES (RESTORED FROM OLD FILE)
    ============================================================= */

    // admin_delegate → ONLY global admin
    if (new_role === "admin_delegate" && targetGlobal !== 3) {
      return res.status(400).json({
        message: "Only global admins can become admin_delegate",
      });
    }

    // lead_faculty → ONLY faculty or global admin
    if (new_role === "lead_faculty" && ![2, 3].includes(targetGlobal)) {
      return res.status(400).json({
        message: "Only faculty/global admins can be lead_faculty",
      });
    }

    /* ============================================================
       Check acting user's authority
    ============================================================= */
    // ❗ Prevent demoting the LAST admin_delegate
    if (currentRole === "admin_delegate" && new_role !== "admin_delegate") {
      const [[count]] = await db.query(
        `SELECT COUNT(*) AS c
        FROM organization_members
        WHERE org_id = ? AND role = 'admin_delegate'`,
        [orgId]
      );

      if (count.c <= 1) {
        return res.status(403).json({
          message:
            "Cannot demote the only admin_delegate. Assign another admin_delegate first.",
        });
      }
    }

    let allowed = false;

    if (isGlobal || orgRole === "admin_delegate") {
      allowed = true;
    }
    else if (orgRole === "lead_faculty") {
      if (currentRole === "admin_delegate" || new_role === "admin_delegate") {
        allowed = false;
      } else {
        allowed = true;
      }
    }
    else if (["event_manager", "coordinator"].includes(orgRole)) {
      allowed =
        BASIC_ORG_ROLES.includes(currentRole) &&
        BASIC_ORG_ROLES.includes(new_role);
    }

    if (!allowed) {
      return res.status(403).json({ message: "Not allowed to assign this role" });
    }

    // apply update
    await db.query(
      `UPDATE organization_members SET role=? WHERE org_id=? AND user_id=?`,
      [new_role, orgId, memberId]
    );

    res.json({ message: "Role updated successfully" });
  } catch (err) {
    console.error("Update role:", err);
    res.status(500).json({ message: "Failed to update role" });
  }
});

/* ============================================================
   TRANSFER ADMIN_ROLE
============================================================ */

router.post("/:id/transfer-admin", async (req, res) => {
  try {
    const orgId = Number(req.params.id);
    const { acting_user_id, new_admin_id } = req.body;

    if (!acting_user_id || !new_admin_id) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    if (!isPositiveInt(orgId)) {
      return res.status(400).json({ message: "Invalid organization id" });
    }

    if (!isPositiveInt(acting_user_id) || !isPositiveInt(new_admin_id)) {
      return res.status(400).json({ message: "Invalid user id(s)" });
    }
    const { globalRole, orgRole } = await getAuthContext(orgId, acting_user_id);

    if (!isGlobalAdmin(globalRole) && orgRole !== "admin_delegate") {
      return res.status(403).json({ message: "Not allowed" });
    }

    const [[user]] = await db.query(
      `SELECT role_id FROM users WHERE user_id=?`,
      [new_admin_id]
    );

    if (!user || user.role_id !== 3) {
      return res.status(400).json({
        message: "New admin must be a global admin",
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

    if (!isGlobalAdmin(globalRole)) {
      await db.query(
        `UPDATE organization_members SET role='member'
         WHERE org_id=? AND user_id=? AND role='admin_delegate'`,
        [orgId, acting_user_id]
      );
    }

    res.json({ message: "Admin transferred" });
  } catch (err) {
    console.error("Transfer admin:", err);
    res.status(500).json({ message: "Failed to transfer admin_delegate role" });
  }
});

/* ============================================================
   GLOBAL ADMINS LIST
============================================================ */

router.get("/global-admins", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT user_id, first_name, last_name, email, user_uid
       FROM users WHERE role_id=3 AND is_active=1`
    );

    res.json(rows);
  } catch (err) {
    console.error("GET global admins:", err);
    res.status(500).json({ message: "Failed to load global admins" });
  }
});

/* ============================================================
   ORG DASHBOARD STATS
============================================================ */

router.get("/dashboard", async (req, res) => {
  try {
    const userId = req.query.user_id;
    if (!userId || !isPositiveInt(userId)) {
      return res.status(400).json({ message: "Valid user_id is required" });
    }


    const [[roleRow]] = await db.query(
      `SELECT r.role_name FROM users u 
       JOIN roles r ON r.role_id=u.role_id 
       WHERE u.user_id=?`,
      [userId]
    );

    const role = roleRow?.role_name ?? null;

    const [[total]] = await db.query(
      `SELECT COUNT(*) AS total_orgs FROM organizations WHERE is_active=1`
    );

    const [[created]] = await db.query(
      `SELECT COUNT(*) AS orgs_created FROM organizations WHERE created_by=?`,
      [userId]
    );

    const [[joined]] = await db.query(
      `SELECT COUNT(*) AS orgs_joined FROM organization_members WHERE user_id=? AND role='member'`,
      [userId]
    );

    let adminOf = 0;

    if (role === "admin") {
      const [[resAdmin]] = await db.query(
        `SELECT COUNT(*) AS admin_of FROM organization_members 
         WHERE user_id=? AND role='admin_delegate'`,
        [userId]
      );
      adminOf = resAdmin.admin_of;
    } else if (role === "faculty") {
      const [[resLead]] = await db.query(
        `SELECT COUNT(*) AS admin_of FROM organization_members 
         WHERE user_id=? AND role='lead_faculty'`,
        [userId]
      );
      adminOf = resLead.admin_of;
    } else {
      const [[resMgr]] = await db.query(
        `SELECT COUNT(*) AS admin_of FROM organization_members 
         WHERE user_id=? AND role IN ('coordinator','event_manager')`,
        [userId]
      );
      adminOf = resMgr.admin_of;
    }

    res.json({
      total_orgs: total.total_orgs,
      orgs_created: created.orgs_created,
      orgs_joined: joined.orgs_joined,
      admin_of: adminOf,
    });
  } catch (err) {
    console.error("Dashboard:", err);
    res.status(500).json({ message: "Failed to load dashboard" });
  }
});

/* ============================================================
   MUTUAL ORGANIZATIONS
============================================================ */
router.get("/mutual-orgs/:viewerId/:profileId", async (req, res) => {
  try {
    const { viewerId, profileId } = req.params;
  
    if (!isPositiveInt(viewerId) || !isPositiveInt(profileId)) {
      return res.status(400).json({ message: "Invalid user id(s)" });
    }
    const [rows] = await db.query(
      `
      SELECT o.org_id AS id, o.title
      FROM organization_members m1
      JOIN organization_members m2 ON m1.org_id = m2.org_id
      JOIN organizations o ON o.org_id = m1.org_id
      WHERE m1.user_id = ? 
        AND m2.user_id = ?
        AND o.is_active = 1
      ORDER BY o.title
      `,
      [viewerId, profileId]
    );

    res.json(rows);
  } catch (err) {
    console.error("Mutual orgs:", err);
    res.status(500).json({ message: "Error loading mutual organizations" });
  }
});

module.exports = router;
