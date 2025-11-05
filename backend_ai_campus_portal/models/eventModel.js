import db from "../db.js";

export const getAllEvents = (callback) => {
  db.query("SELECT * FROM events", callback);
};

export const createEvent = (eventData, callback) => {
  const { title, description, date, location } = eventData;
  db.query(
    "INSERT INTO events (title, description, date, location) VALUES (?, ?, ?, ?)",
    [title, description, date, location],
    callback
  );
};

export const updateEvent = (id, eventData, callback) => {
  const { title, description, date, location } = eventData;
  db.query(
    "UPDATE events SET title = ?, description = ?, date = ?, location = ? WHERE id = ?",
    [title, description, date, location, id],
    callback
  );
};

export const deleteEvent = (id, callback) => {
  db.query("DELETE FROM events WHERE id = ?", [id], callback);
};
