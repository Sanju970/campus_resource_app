import express from "express";
import {
  getDashboardStats,
  listAllUsers,
  deleteUserById,
  deleteEventById,
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/dashboard", getDashboardStats);
router.get("/users", listAllUsers);
router.delete("/users/:id", deleteUserById);
router.delete("/events/:id", deleteEventById);

export default router;


