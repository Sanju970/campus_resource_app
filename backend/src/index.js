require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

// --- Import DB Connection ---
const db = require("./config/db");

// --- Import Routes ---
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const announcementRoutes = require("./routes/announcements");
const eventRoutes = require("./routes/events");
const favoriteRoutes = require("./routes/favorites");
const notificationRoutes = require("./routes/notifications");
const registrationRoutes = require("./routes/event_registrations");
const organizationRoutes = require("./routes/organizations");
const orgCategoriesRoutes = require("./routes/orgCategories");
const facultyRoutes = require("./routes/faculty");
const scheduleRoutes = require("./routes/scheduleRoutes");
const locationRoutes = require("./routes/location");
const assistantRoutes = require("./routes/assistant");
const dashboardRoutes = require("./routes/dashboard");

// --- Initialize Express App ---
const app = express();



const FRONTEND_URL = process.env.FRONTEND_URL || "https://sxt0660.uta.cloud";

app.use(
  cors({
    origin: FRONTEND_URL, 
    credentials: true, 
  })
);

// Additional headers for Axios + cookies
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", FRONTEND_URL);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});

app.use(express.json());

// --- Verify DB Connection ---
db.getConnection()
  .then((conn) => {
    console.log("✅ Connected to MySQL Database");
    conn.release();
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
  });

// --- Mount All Routes ---
app.use("/api/auth", authRoutes);
app.use("/api", userRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/event_registrations", registrationRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/org-categories", orgCategoriesRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/assistant", assistantRoutes);
app.use("/api/dashboard", dashboardRoutes);

// --- Root Endpoint ---
app.get("/", (req, res) => {
  res.send("Campus Portal Backend is running successfully!");
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
