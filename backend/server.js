// ============================================================
//  server.js — Resume Analyzer Backend (DeepSeek AI + dotenv)
//
//  Install:  npm install express multer cors axios pdf-parse dotenv
//  Start:    node server.js
// ============================================================

require("dotenv").config();

const express  = require("express");
const cors     = require("cors");
const multer   = require("multer");
const axios    = require("axios");
const pdfParse = require("pdf-parse");

const app  = express();
const PORT = 5000;

// ── Middleware ───────────────────────────────────────────────
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// ── Multer ───────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    file.mimetype === "application/pdf"
      ? cb(null, true)
      : cb(new Error("Only PDF files are accepted."), false);
  },
});

// ── DeepSeek Analysis ────────────────────────────────────────
async function analyzeWithDeepSeek(resumeText) {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is missing from your .env file.");
  }

  console.log("📤 Sending request to DeepSeek...");

  const response = await axios.post(
    "https://api.deepseek.com/chat/completions",
    {
      model: "deepseek-chat",
      max_tokens: 1024,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content:
            "You are an expert resume reviewer. " +
            "Respond with a single valid JSON object only. " +
            "No markdown, no code fences, no explanation — just raw JSON.",
        },
        {
          role: "user",
          content: `Analyze this resume and return ONLY a JSON object:

{
  "overallScore": <integer 0-100>,
  "summary": "<2-3 sentence assessment of this specific resume>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>", "<strength 4>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>", "<improvement 4>", "<improvement 5>"],
  "skills": ["<skill 1>", "<skill 2>", "<skill 3>", ...],
  "keywords": ["<keyword 1>", "<keyword 2>", "<keyword 3>", ...]
}

Base everything on the ACTUAL content of this resume.

Resume:
---
${resumeText}
---

Return ONLY the JSON.`,
        },
      ],
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 60000, // 60 seconds
    }
  );

  console.log("✅ DeepSeek responded successfully.");

  const raw = response.data.choices[0].message.content
    .replace(/```json|```/gi, "")
    .trim();

  return JSON.parse(raw);
}

// ── POST /analyze/text ───────────────────────────────────────
app.post("/analyze/text", async (req, res) => {
  const { resumeText } = req.body;

  if (!resumeText || !resumeText.trim()) {
    return res.status(400).json({ error: "resumeText is required." });
  }

  try {
    const analysis = await analyzeWithDeepSeek(resumeText.trim());
    return res.json({ analysis });
  } catch (err) {
    // Log full error details in the terminal
    if (err.response) {
      console.error("❌ DeepSeek API error:", err.response.status, JSON.stringify(err.response.data));
      return res.status(500).json({ error: `DeepSeek error ${err.response.status}: ${JSON.stringify(err.response.data)}` });
    } else if (err.code === "ECONNABORTED") {
      console.error("❌ DeepSeek timed out after 60s");
      return res.status(500).json({ error: "DeepSeek API timed out. Try again." });
    } else {
      console.error("❌ Error:", err.message);
      return res.status(500).json({ error: err.message });
    }
  }
});

// ── POST /analyze/pdf ────────────────────────────────────────
app.post("/analyze/pdf", upload.single("resume"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "A PDF file is required (field: 'resume')." });
  }

  try {
    const pdfData = await pdfParse(req.file.buffer);

    if (!pdfData.text || !pdfData.text.trim()) {
      return res.status(400).json({
        error: "Could not extract text from PDF. Make sure it is not a scanned image.",
      });
    }

    const analysis = await analyzeWithDeepSeek(pdfData.text.trim());
    return res.json({ analysis });
  } catch (err) {
    if (err.response) {
      console.error("❌ DeepSeek API error:", err.response.status, JSON.stringify(err.response.data));
      return res.status(500).json({ error: `DeepSeek error ${err.response.status}: ${JSON.stringify(err.response.data)}` });
    } else if (err.code === "ECONNABORTED") {
      console.error("❌ DeepSeek timed out after 60s");
      return res.status(500).json({ error: "DeepSeek API timed out. Try again." });
    } else {
      console.error("❌ Error:", err.message);
      return res.status(500).json({ error: err.message });
    }
  }
});

// ── Multer error handler ─────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

// ── Health check ─────────────────────────────────────────────
app.get("/health", (_req, res) =>
  res.json({ status: "ok", time: new Date().toISOString() })
);

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  if (!process.env.DEEPSEEK_API_KEY) {
    console.warn("\n⚠️  DEEPSEEK_API_KEY not found in .env — requests will fail!");
  } else {
    console.log("\n🔑  DeepSeek API key loaded — AI is active.");
  }
  console.log(`✅  Server running on http://localhost:${PORT}\n`);
});