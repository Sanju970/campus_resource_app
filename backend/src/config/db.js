// backend/src/config/db.js
const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: process.env.DB_HOST,      
  user: process.env.DB_USER,     
  password: process.env.DB_PASSWORD, 
  database: process.env.DB_NAME,  
  port: process.env.DB_PORT || 3306,
  connectionLimit: 10,
  waitForConnections: true,
  ssl: {
    rejectUnauthorized: false   
  }
});

// test connection
db.getConnection()
  .then(conn => {
    console.log("MySQL Connected Successfully!");
    conn.release();
  })
  .catch(err => {
    console.error("Database connection failed:", err);
  });

module.exports = db;
