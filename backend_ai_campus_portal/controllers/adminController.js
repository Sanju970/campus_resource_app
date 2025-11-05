import { getAllUsers, deleteUser } from "../models/userModel.js";
import { getAllEvents, deleteEvent } from "../models/eventModel.js";
import { getAllOrganizations } from "../models/orgModel.js";

export const getDashboardStats = async (req, res) => {
  try {
    let stats = {};
    const queryPromise = (sql) =>
      new Promise((resolve, reject) => {
        import("../db.js").then(({ default: db }) => {
          db.query(sql, (err, results) => {
            if (err) reject(err);
            else resolve(results.length);
          });
        });
      });

    stats.users = await queryPromise("SELECT * FROM users");
    stats.events = await queryPromise("SELECT * FROM events");
    stats.orgs = await queryPromise("SELECT * FROM organizations");

    res.status(200).json(stats);
  } catch (err) {
    res.status(500).send(err);
  }
};

export const listAllUsers = (req, res) => {
  getAllUsers((err, results) => {
    if (err) return res.status(500).send(err);
    res.status(200).json(results);
  });
};

export const deleteUserById = (req, res) => {
  deleteUser(req.params.id, (err) => {
    if (err) return res.status(500).send(err);
    res.status(200).send("User deleted successfully");
  });
};

export const deleteEventById = (req, res) => {
  deleteEvent(req.params.id, (err) => {
    if (err) return res.status(500).send(err);
    res.status(200).send("Event deleted successfully");
  });
};
