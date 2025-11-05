import { getAllEvents, createEvent, updateEvent, deleteEvent } from "../models/eventModel.js";

export const listEvents = (req, res) => {
  getAllEvents((err, results) => {
    if (err) return res.status(500).send(err);
    res.status(200).json(results);
  });
};

export const addEvent = (req, res) => {
  createEvent(req.body, (err) => {
    if (err) return res.status(500).send(err);
    res.status(200).send("Event created successfully");
  });
};

export const editEvent = (req, res) => {
  updateEvent(req.params.id, req.body, (err) => {
    if (err) return res.status(500).send(err);
    res.status(200).send("Event updated successfully");
  });
};

export const removeEvent = (req, res) => {
  deleteEvent(req.params.id, (err) => {
    if (err) return res.status(500).send(err);
    res.status(200).send("Event deleted successfully");
  });
};
