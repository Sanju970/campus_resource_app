import db from "../db.js";

export const getAllOrganizations = (callback) => {
  db.query("SELECT * FROM organizations", callback);
};

export const joinOrganization = (userId, orgId, callback) => {
  db.query(
    "INSERT INTO user_orgs (user_id, org_id) VALUES (?, ?)",
    [userId, orgId],
    callback
  );
};
