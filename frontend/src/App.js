// ============================================================
//  App.js — Resume Analyzer Frontend
//  Stack: React (Create React App) + Axios
// ============================================================

import React, { useState, useRef } from "react";
import axios from "axios";
import "./App.css";

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
    if (f && f.type === "application/pdf") { setPdfFile(f); setError(""); }
    else setError("Please select a valid PDF file.");
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type === "application/pdf") { setPdfFile(f); setError(""); }
    else setError("Only PDF files are accepted.");
  }

  async function handleAnalyze() {
    setError("");
    setResult(null);

    if (mode === "paste" && !resumeText.trim()) {
      setError("Please paste your resume text before analyzing.");
      return;
    }
    if (mode === "upload" && !pdfFile) {
      setError("Please upload a PDF file before analyzing.");
      return;
    }

    setLoading(true);
    try {
      let response;

      if (mode === "paste") {
        response = await axios.post(
          "http://localhost:5000/analyze/text",
          { resumeText },
          { timeout: 90000 } // 90 seconds — matches backend
        );
      } else {
        const formData = new FormData();
        formData.append("resume", pdfFile);
        response = await axios.post(
          "http://localhost:5000/analyze/pdf",
          formData,
          { headers: { "Content-Type": "multipart/form-data" }, timeout: 90000 }
        );
      }

      setResult(response.data.analysis);
    } catch (err) {
      if (err.response) {
        setError(`Server error ${err.response.status}: ${err.response.data?.error || "Unknown error"}`);
      } else if (err.code === "ECONNABORTED") {
        setError("Request timed out. DeepSeek is taking too long — please try again.");
      } else {
        setError("Could not reach the backend. Is the server running on port 5000?");
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
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      <div className="container">
        <header className="header">
          <div className="logo-mark"><SparkleIcon /></div>
          <div>
            <h1 className="title">Resume<span className="title-accent">AI</span></h1>
            <p className="subtitle">Intelligent resume analysis in seconds</p>
          </div>
        </header>

        {!result && (
          <div className="card input-card">
            <div className="mode-switcher">
              <button className={`mode-btn ${mode === "paste" ? "active" : ""}`}
                onClick={() => { setMode("paste"); setError(""); }}>
                Paste Text
              </button>
              <button className={`mode-btn ${mode === "upload" ? "active" : ""}`}
                onClick={() => { setMode("upload"); setError(""); }}>
                Upload PDF
              </button>
            </div>

            {mode === "paste" && (
              <textarea
                className="resume-textarea"
                placeholder="Paste your resume content here…"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                rows={14}
              />
            )}

            {mode === "upload" && (
              <div
                className={`drop-zone ${dragOver ? "drag-over" : ""} ${pdfFile ? "has-file" : ""}`}
                onClick={() => fileInputRef.current.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <input ref={fileInputRef} type="file" accept="application/pdf"
                  style={{ display: "none" }} onChange={handleFileChange} />
                {pdfFile ? (
                  <div className="file-info">
                    <div className="file-icon-wrap"><FileIcon /></div>
                    <div>
                      <p className="file-name">{pdfFile.name}</p>
                      <p className="file-size">{(pdfFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                ) : (
                  <div className="drop-prompt">
                    <div className="upload-icon-wrap"><UploadIcon /></div>
                    <p className="drop-title">Drop your PDF here</p>
                    <p className="drop-hint">or click to browse</p>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="error-banner">
                <AlertIcon /><span>{error}</span>
              </div>
            )}

            <button
              className={`analyze-btn ${loading ? "loading" : ""}`}
              onClick={handleAnalyze}
              disabled={loading}
            >
              {loading ? (
                <><span className="spinner" /> Analyzing… (may take 20-30s)</>
              ) : (
                <><SparkleIcon /> Analyze Resume</>
              )}
            </button>
          </div>
        )}

        {result && (
          <div className="results-wrapper">
            <div className="card score-card">
              <ScoreRing score={result.overallScore} />
              <div className="score-meta">
                <h2 className="score-title">Overall Score</h2>
                <p className="score-desc">{result.summary}</p>
              </div>
            </div>

            <div className="card detail-card">
              <h3 className="section-heading strengths-heading">Strengths</h3>
              <ul className="insight-list">
                {result.strengths.map((s, i) => (
                  <li key={i} className="insight-item strength-item">
                    <span className="insight-icon"><CheckIcon /></span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card detail-card">
              <h3 className="section-heading improvements-heading">Areas to Improve</h3>
              <ul className="insight-list">
                {result.improvements.map((imp, i) => (
                  <li key={i} className="insight-item improvement-item">
                    <span className="insight-icon"><AlertIcon /></span>
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card detail-card">
              <h3 className="section-heading skills-heading">Detected Skills</h3>
              <div className="skill-tags">
                {result.skills.map((skill, i) => (
                  <span key={i} className="skill-tag">{skill}</span>
                ))}
              </div>
            </div>

            <div className="card detail-card">
              <h3 className="section-heading keywords-heading">Recommended Keywords</h3>
              <div className="skill-tags">
                {result.keywords.map((kw, i) => (
                  <span key={i} className="keyword-tag">{kw}</span>
                ))}
              </div>
            </div>

            <button className="reset-btn" onClick={handleReset}>
              ← Analyze Another Resume
            </button>
          </div>
        )}
      </div>
    </div>
  );
}