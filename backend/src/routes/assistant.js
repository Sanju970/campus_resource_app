// backend/src/routes/assistant.js
const express = require("express");
const router = express.Router();

// Uses global fetch (Node 18+). If you're on an older Node, install node-fetch and use that instead.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Simple helper to call Gemini 2.5 Flash text model
async function callGemini2_5(prompt, history = []) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
  }

  // Build conversation contents for Gemini API
  const contents = [];

  // Optional: include short conversation history so responses feel contextual
  for (const msg of history.slice(-6)) {
    contents.push({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    });
  }

  // Latest user turn with system-style guidance
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
          `- When relevant, refer users to the specific pages in the portal, like Events, Organizations, Materials, or Announcements.\n` +
          `- If you don't know something exactly (like very specific policy text), say so and suggest where they might find it.\n\n` +
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
    body: JSON.stringify({
      contents,
    }),
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

// POST /api/assistant/chat
router.post("/chat", async (req, res) => {
  try {
    const { message, history } = req.body || {};

    if (!message || typeof message !== "string") {
      return res
        .status(400)
        .json({ error: "Request body must include a 'message' string." });
    }

    const reply = await callGemini2_5(message, Array.isArray(history) ? history : []);

    return res.json({
      reply,
    });
  } catch (err) {
    console.error("Campus Assistant error:", err);
    return res.status(500).json({
      error: "Failed to generate a response from the Campus Assistant.",
    });
  }
});

module.exports = router;
