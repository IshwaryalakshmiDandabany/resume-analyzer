import React, { useState, useRef } from "react";
import axios from "axios";
import "./App.css";

const BASE_URL = "https://resume-analyzer-8d1l.onrender.com";

export default function App() {
  const [mode, setMode] = useState("paste");
  const [resumeText, setResumeText] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);

  async function handleAnalyze() {
    setError("");
    setResult(null);

    if (mode === "paste" && !resumeText.trim()) {
      setError("Paste resume first");
      return;
    }

    if (mode === "upload" && !pdfFile) {
      setError("Upload PDF first");
      return;
    }

    setLoading(true);

    try {
      let response;

      if (mode === "paste") {
        response = await axios.post(
          `${BASE_URL}/analyze/text`,
          { resumeText }
        );
      } else {
        const formData = new FormData();
        formData.append("resume", pdfFile);

        response = await axios.post(
          `${BASE_URL}/analyze/pdf`,
          formData
        );
      }

      setResult(response.data.analysis);
    } catch (err) {
      setError("Backend error or not reachable");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <div className="container">

        <header className="header">
          <h1 className="title">Resume <span className="title-accent">AI</span></h1>
          <p className="subtitle">Smart Resume Analyzer</p>
        </header>

        {!result && (
          <div className="card input-card">

            {/* MODE SWITCH */}
            <div className="mode-switcher">
              <button
                className={`mode-btn ${mode === "paste" ? "active" : ""}`}
                onClick={() => setMode("paste")}
              >
                Paste
              </button>

              <button
                className={`mode-btn ${mode === "upload" ? "active" : ""}`}
                onClick={() => setMode("upload")}
              >
                Upload PDF
              </button>
            </div>

            {/* TEXT AREA */}
            {mode === "paste" && (
              <textarea
                className="resume-textarea"
                placeholder="Paste your resume..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
              />
            )}

            {/* FILE UPLOAD */}
            {mode === "upload" && (
              <div
                className="drop-zone"
                onClick={() => fileInputRef.current.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  hidden
                  accept="application/pdf"
                  onChange={(e) => setPdfFile(e.target.files[0])}
                />
                <p>{pdfFile ? pdfFile.name : "Click to upload PDF"}</p>
              </div>
            )}

            {/* ERROR */}
            {error && <div className="error-banner">{error}</div>}

            {/* BUTTON */}
            <button
              className={`analyze-btn ${loading ? "loading" : ""}`}
              onClick={handleAnalyze}
              disabled={loading}
            >
              {loading ? "Analyzing..." : "Analyze Resume"}
            </button>

          </div>
        )}

        {/* RESULT */}
        {result && (
          <div className="results-wrapper">

            <div className="card score-card">
              <h2>Score: {result.overallScore}</h2>
              <p>{result.summary}</p>
            </div>

            <div className="card detail-card">
              <h3 className="section-heading strengths-heading">Strengths</h3>
              <ul className="insight-list">
                {result.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>

            <div className="card detail-card">
              <h3 className="section-heading improvements-heading">Improvements</h3>
              <ul className="insight-list">
                {result.improvements.map((i, idx) => <li key={idx}>{i}</li>)}
              </ul>
            </div>

            <button className="reset-btn" onClick={() => setResult(null)}>
              Analyze Another
            </button>

          </div>
        )}

      </div>
    </div>
  );
}