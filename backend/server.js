// ============================================================
//  Resume Analyzer Backend (DeepSeek AI + Render Ready)
// ============================================================

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const axios = require("axios");
const pdfParse = require("pdf-parse");

const app = express();
const PORT = process.env.PORT || 5000;

// ─────────────────────────────────────────────
// CORS CONFIG (IMPORTANT FOR VERCEL)
// ─────────────────────────────────────────────
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// ─────────────────────────────────────────────
// ROOT ROUTE (fixes "Cannot GET /")
// ─────────────────────────────────────────────
app.get("/", (req, res) => {
  res.send("🚀 Resume Analyzer Backend is Running");
});

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    time: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────
// MULTER CONFIG (PDF upload)
// ─────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

// ─────────────────────────────────────────────
// DEEPSEEK AI FUNCTION
// ─────────────────────────────────────────────
async function analyzeWithDeepSeek(resumeText) {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new Error("Missing DEEPSEEK_API_KEY in environment variables");
  }

  const response = await axios.post(
    "https://api.deepseek.com/chat/completions",
    {
      model: "deepseek-chat",
      temperature: 0.7,
      max_tokens: 1200,
      messages: [
        {
          role: "system",
          content:
            "You are an expert resume reviewer. Return ONLY valid JSON. No markdown, no explanation.",
        },
        {
          role: "user",
          content: `
Analyze this resume and return ONLY JSON:

{
  "overallScore": 0-100,
  "summary": "short analysis",
  "strengths": [],
  "improvements": [],
  "skills": [],
  "keywords": []
}

Resume:
${resumeText}
          `,
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 60000,
    }
  );

  let raw = response.data.choices[0].message.content;

  // Clean possible markdown
  raw = raw.replace(/```json|```/g, "").trim();

  return JSON.parse(raw);
}

// ─────────────────────────────────────────────
// TEXT ANALYSIS ROUTE
// ─────────────────────────────────────────────
app.post("/analyze/text", async (req, res) => {
  const { resumeText } = req.body;

  if (!resumeText) {
    return res.status(400).json({ error: "resumeText is required" });
  }

  try {
    const analysis = await analyzeWithDeepSeek(resumeText);
    res.json({ analysis });
  } catch (err) {
    console.error("Text analysis error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// PDF ANALYSIS ROUTE
// ─────────────────────────────────────────────
app.post("/analyze/pdf", upload.single("resume"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "PDF file is required" });
  }

  try {
    const pdfData = await pdfParse(req.file.buffer);

    if (!pdfData.text || !pdfData.text.trim()) {
      return res.status(400).json({
        error: "Could not extract text from PDF",
      });
    }

    const analysis = await analyzeWithDeepSeek(pdfData.text);
    res.json({ analysis });
  } catch (err) {
    console.error("PDF analysis error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// ERROR HANDLING (MULTER)
// ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

// ─────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);

  if (!process.env.DEEPSEEK_API_KEY) {
    console.warn("⚠️ WARNING: Missing DEEPSEEK_API_KEY");
  } else {
    console.log("🔑 DeepSeek API Key loaded");
  }
});