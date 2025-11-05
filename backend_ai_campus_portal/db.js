import mysql from "mysql2";

const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "admin123",
  database: "campus_portal",
  port: 3306
});

db.connect(err => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
    return;
  }
  console.log("✅ MySQL connected and using database 'campus_portal'.");
});

export default db;
