// ============================================================
//  App.js — Resume Analyzer Frontend (FINAL WORKING VERSION)
// ============================================================

import React, { useState, useRef } from "react";
import axios from "axios";
import "./App.css";

export default function App() {
  const [mode, setMode] = useState("paste");
  const [resumeText, setResumeText] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

      // ✅ TEXT MODE
      if (mode === "paste") {
        response = await axios.post(
          "https://resume-analyzer-8d1l.onrender.com/analyze/text",
          { resumeText },
          { timeout: 90000 }
        );
      }

      // ✅ PDF MODE
      else {
        const formData = new FormData();
        formData.append("resume", pdfFile);

        response = await axios.post(
          "https://resume-analyzer-8d1l.onrender.com/analyze/pdf",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            timeout: 90000,
          }
        );
      }

      setResult(response.data.analysis);
    } catch (err) {
      if (err.response) {
        setError(
          `Server error ${err.response.status}: ${
            err.response.data?.error || "Unknown error"
          }`
        );
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

        <h1>Resume AI</h1>

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
              {result.strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>

            <h3>Improvements</h3>
            <ul>
              {result.improvements.map((i, idx) => (
                <li key={idx}>{i}</li>
              ))}
            </ul>

            <button onClick={handleReset}>Analyze Another</button>
          </div>
        )}

      </div>
    </div>
  );
}