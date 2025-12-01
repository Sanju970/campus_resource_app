// backend/src/routes/assistant.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const jwt = require("jsonwebtoken");

// Uses global fetch (Node 18+). If you're on an older Node, install node-fetch and use that instead.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";

//  Helper: get userId from Authorization header
function getUserIdFromAuth(req) {
  const authHeader = req.headers.authorization || "";
  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") return null;

  const token = parts[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.user_id || null;
  } catch (err) {
    console.error("Assistant JWT decode error:", err);
    return null;
  }
}

/* ============================================================
   Helper: Build campus context from live DB data
   (events, orgs, announcements, user's events)
============================================================ */
async function buildCampusContext(userId) {
  try {
    // Upcoming approved events + location label via campus_locations
    const [events] = await db.query(
      `
      SELECT 
        e.event_id,
        e.title,
        e.start_datetime,
        e.end_datetime,
        cl.location_name,
        cl.building,
        cl.room
      FROM events e
      LEFT JOIN campus_locations cl
        ON e.location_id = cl.location_id
      WHERE e.status = 'approved'
        AND e.start_datetime >= NOW()
      ORDER BY e.start_datetime ASC
      LIMIT 5;
      `
    );

    // Active organizations + category name
    const [orgs] = await db.query(
      `
      SELECT 
        o.org_id,
        o.title,
        oc.category_name
      FROM organizations o
      LEFT JOIN organization_categories oc
        ON oc.category_id = o.category_id
      WHERE o.is_active = 1
      ORDER BY o.title ASC
      LIMIT 10;
      `
    );

    // Recent announcements
    const [announcements] = await db.query(
      `
      SELECT 
        announcement_id,
        title,
        priority,
        created_at
      FROM announcements
      ORDER BY created_at DESC
      LIMIT 5;
      `
    );

    // This user's registered events
    let userEvents = [];
    if (userId) {
      const [rows] = await db.query(
        `
        SELECT 
          e.event_id,
          e.title,
          e.start_datetime,
          e.end_datetime
        FROM event_registrations er
        JOIN events e
          ON er.event_id = e.event_id
        WHERE er.user_id = ?
          AND e.status = 'approved'
        ORDER BY e.start_datetime ASC;
        `,
        [userId]
      );
      userEvents = rows;
    }

    // Build readable location label like "Library, Main Building, Room 101"
    const formatLocation = (row) => {
      const parts = [];
      if (row.location_name) parts.push(row.location_name);
      if (row.building) parts.push(row.building);
      if (row.room) parts.push(`Room ${row.room}`);
      return parts.join(", ") || "TBA";
    };

    const pieces = [];

    if (events.length) {
      pieces.push(
        "Upcoming approved events: " +
          events
            .map(
              (e) =>
                `${e.title} on ${e.start_datetime} at ${formatLocation(e)}`
            )
            .join(" | ")
      );
    }

    if (orgs.length) {
      pieces.push(
        "Active organizations: " +
          orgs
            .map((o) =>
              o.category_name
                ? `${o.title} (${o.category_name})`
                : o.title
            )
            .join(" | ")
      );
    }

    if (announcements.length) {
      pieces.push(
        "Recent announcements: " +
          announcements
            .map((a) => `${a.title} [${a.priority}]`)
            .join(" | ")
      );
    }

    if (userEvents.length) {
      pieces.push(
        "This user's registered events: " +
          userEvents
            .map(
              (e) =>
                `${e.title} from ${e.start_datetime} to ${e.end_datetime}`
            )
            .join(" | ")
      );
    }

    return pieces.join("\n");
  } catch (err) {
    console.error("Error building campus context:", err);
    // Fail gracefully: return empty context so the assistant still works
    return "";
  }
}

/* ============================================================
   Gemini helper – now takes campusContext as extra info
============================================================ */
async function callGemini2_5(prompt, history = [], campusContext = "") {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
  }

  const contents = [];

  // Include short recent history so conversation feels contextual
  for (const msg of history.slice(-6)) {
    contents.push({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    });
  }

  // Latest user turn, with system prompt + campus data
  contents.push({
    role: "user",
    parts: [
      {
        text:
          `You are the Campus AI Assistant for a university campus portal. ` +
          `Your job is to help students, faculty, and staff with:\n\n` +
          `• Campus events, registrations, and deadlines\n` +
          `• Organizations, student services, and support centers\n` +
          `• Announcements, notifications, and general campus information\n\n` +
          `Guidelines:\n` +
          `- Keep answers concise and friendly.\n` +
          `- Respond ONLY in plain text. Do NOT use markdown: no *, no **, no headings, no italics.\n` +
          `- When relevant, refer users to the specific pages in the portal, like Events, Organizations, Materials, or Announcements.\n` +
          `- If you don't know something exactly (like very specific policy text), say so and suggest where they might find it.\n\n` +
          (campusContext
            ? `Here is up-to-date campus data from the portal. Use this to answer the user:\n${campusContext}\n\n`
            : "") +
          `User: ${prompt}`,
      },
    ],
  });

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
    GEMINI_API_KEY;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ contents }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    console.error("Gemini API error:", response.status, errBody);
    throw new Error("Gemini API request failed");
  }

  const data = await response.json();

  const text =
    data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text || "")
      .join(" ")
      .trim() || "Sorry, I couldn’t generate a response right now.";

  return text;
}

/* ============================================================
   POST /api/assistant/chat
============================================================ */
router.post("/chat", async (req, res) => {
  try {
    const { message, history } = req.body || {};

    if (!message || typeof message !== "string") {
      return res
        .status(400)
        .json({ error: "Request body must include a 'message' string." });
    }

    const userId = getUserIdFromAuth(req);
    const campusContext = await buildCampusContext(userId);

    const reply = await callGemini2_5(
      message,
      Array.isArray(history) ? history : [],
      campusContext
    );

    return res.json({ reply });
  } catch (err) {
    console.error("Campus Assistant error:", err);
    return res.status(500).json({
      error: "Failed to generate a response from the Campus Assistant.",
      detail: err.message,
    });
  }
});

module.exports = router;
