const express = require('express');
const router = express.Router();
const db = require('../config/db');

const fetchAll = (tableName, res) => {
  db.query(`SELECT * FROM ${tableName}`, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

router.get('/roles', (req, res) => fetchAll('roles', res));
router.get('/users', (req, res) => fetchAll('users', res));
router.get('/events', (req, res) => fetchAll('events', res));
router.get('/announcements', (req, res) => fetchAll('announcements', res));
router.get('/favorites', (req, res) => fetchAll('favorites', res));
router.get('/notifications', (req, res) => fetchAll('notifications', res));
router.get('/event_registrations', (req, res) => fetchAll('event_registrations', res));

module.exports = router;
