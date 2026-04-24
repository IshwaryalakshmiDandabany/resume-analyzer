// ============================================================
//  App.js — Resume Analyzer Frontend (FIXED FOR DEPLOYMENT)
// ============================================================

import React, { useState, useRef } from "react";
import axios from "axios";
import "./App.css";

  const BASE_URL = "https://resume-analyzer-8d1l.onrender.com?v=3";

// Icons (unchanged)
const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const FileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const SparkleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

function ScoreRing({ score }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#4ade80" : score >= 60 ? "#facc15" : "#f87171";

  return (
    <div className="score-ring-wrapper">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
        <circle
          cx="70" cy="70" r={radius}
          fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
          style={{ transition: "stroke-dashoffset 1s ease, stroke 0.4s" }}
        />
      </svg>
      <div className="score-ring-label">
        <span className="score-number" style={{ color }}>{score}</span>
        <span className="score-sub">/ 100</span>
      </div>
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState("paste");
  const [resumeText, setResumeText] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef(null);

  function handleFileChange(e) {
    const f = e.target.files[0];
    if (f && f.type === "application/pdf") {
      setPdfFile(f);
      setError("");
    } else {
      setError("Please select a valid PDF file.");
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type === "application/pdf") {
      setPdfFile(f);
      setError("");
    } else {
      setError("Only PDF files are accepted.");
    }
  }

  async function handleAnalyze() {
    setError("");
    setResult(null);

    if (mode === "paste" && !resumeText.trim()) {
      setError("Please paste your resume content.");
      return;
    }

    if (mode === "upload" && !pdfFile) {
      setError("Please upload a PDF file.");
      return;
    }

    setLoading(true);

    try {
      let response;

      if (mode === "paste") {
        response = await axios.post(
          `${BASE_URL}/analyze/text`,
          { resumeText },
          { timeout: 90000 }
        );
      } else {
        const formData = new FormData();
        formData.append("resume", pdfFile);

        response = await axios.post(
          `${BASE_URL}/analyze/pdf`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            timeout: 90000
          }
        );
      }

      setResult(response.data.analysis);
    } catch (err) {
      if (err.response) {
        setError(`Server error ${err.response.status}: ${err.response.data?.error || "Unknown error"}`);
      } else if (err.code === "ECONNABORTED") {
        setError("Request timed out. AI is taking too long.");
      } else {
        setError("Backend not reachable. Check Render deployment.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResumeText("");
    setPdfFile(null);
    setResult(null);
    setError("");
  }

  return (
    <div className="app">
      <div className="container">

        <header className="header">
          <h1>Resume AI</h1>
        </header>

        {!result && (
          <div className="card">

            <div>
              <button onClick={() => setMode("paste")}>Paste</button>
              <button onClick={() => setMode("upload")}>Upload PDF</button>
            </div>

            {mode === "paste" && (
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste resume here..."
                rows={10}
              />
            )}

            {mode === "upload" && (
              <div onClick={() => fileInputRef.current.click()}>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="application/pdf"
                  onChange={handleFileChange}
                  hidden
                />
                {pdfFile ? <p>{pdfFile.name}</p> : <p>Click to upload PDF</p>}
              </div>
            )}

            {error && <p style={{ color: "red" }}>{error}</p>}

            <button onClick={handleAnalyze} disabled={loading}>
              {loading ? "Analyzing..." : "Analyze Resume"}
            </button>

          </div>
        )}

        {result && (
          <div>
            <h2>Score: {result.overallScore}</h2>
            <p>{result.summary}</p>

            <h3>Strengths</h3>
            <ul>
              {result.strengths.map((s, i) => <li key={i}>{s}</li>)}
            </ul>

            <h3>Improvements</h3>
            <ul>
              {result.improvements.map((i, idx) => <li key={idx}>{i}</li>)}
            </ul>

            <button onClick={handleReset}>Analyze Another</button>
          </div>
        )}

      </div>
    </div>
  );
}