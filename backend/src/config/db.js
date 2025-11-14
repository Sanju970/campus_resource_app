const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Optional: test connection
db.getConnection()
  .then(conn => {
    console.log("MySQL Connected...");
    conn.release();
  })
  .catch(err => {
    console.error("Database connection failed:", err);
  });

module.exports = db;
