import { getUserById, updateUser } from "../models/userModel.js";

export const getProfile = (req, res) => {
  if (!req.session.user) return res.status(401).send("Not logged in");
  const userId = req.session.user.id;
  getUserById(userId, (err, results) => {
    if (err) return res.status(500).send(err);
    res.status(200).json(results[0]);
  });
};

export const updateProfile = (req, res) => {
  if (!req.session.user) return res.status(401).send("Not logged in");
  const userId = req.session.user.id;
  const { name, email } = req.body;
  updateUser(userId, name, email, (err) => {
    if (err) return res.status(500).send(err);
    res.status(200).send("Profile updated successfully");
  });
};
