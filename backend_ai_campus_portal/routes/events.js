import express from "express";
import { listEvents, addEvent, editEvent, removeEvent } from "../controllers/eventController.js";

const router = express.Router();

router.get("/", listEvents);
router.post("/", addEvent);
router.put("/:id", editEvent);
router.delete("/:id", removeEvent);

export default router;
