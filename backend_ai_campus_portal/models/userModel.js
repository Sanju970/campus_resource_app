import db from "../db.js";

export const getUserById = (id, callback) => {
  db.query("SELECT id, name, email, role FROM users WHERE id = ?", [id], callback);
};

export const updateUser = (id, name, email, callback) => {
  db.query("UPDATE users SET name = ?, email = ? WHERE id = ?", [name, email, id], callback);
};

export const getAllUsers = (callback) => {
  db.query("SELECT id, name, email, role FROM users", callback);
};

export const deleteUser = (id, callback) => {
  db.query("DELETE FROM users WHERE id = ?", [id], callback);
};
