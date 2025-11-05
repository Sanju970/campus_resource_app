import express from "express";
import session from "express-session";
import cors from "cors";
import db from "./db.js";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import eventRoutes from "./routes/events.js";
import adminRoutes from "./routes/admin.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(
  session({
    secret: "campusSecretKey",
    resave: false,
    saveUninitialized: false,
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/admin", adminRoutes);

app.listen(3000, () => console.log("Backend running on http://localhost:3000"));
