return (
  <div className="app">

    {/* floating background icons */}
    <div className="floating-icons">
      <div className="icon">📄</div>
      <div className="icon">💼</div>
      <div className="icon">📊</div>
      <div className="icon">🧠</div>
    </div>

    <div className="container">

      {/* HEADER */}
      <header className="header">
        <div className="logo-mark">📄</div>
        <h1 className="title">
          Resume <span className="title-accent">AI</span>
        </h1>
        <p className="subtitle">Smart resume analysis with AI insights</p>
      </header>

      {/* WELCOME (only when no result & no input yet feel) */}
      {!result && (
        <div className="card">
          <h2>Welcome 👋</h2>
          <p style={{ color: "#94a3b8", marginTop: "10px" }}>
            Upload or paste your resume to get AI-powered feedback on skills, strengths, and improvements.
          </p>
        </div>
      )}

      {/* INPUT */}
      {!result && (
        <div className="card">

          <div className="mode-switcher">
            <button className={`mode-btn ${mode === "paste" ? "active" : ""}`}
              onClick={() => setMode("paste")}>
              Paste
            </button>

            <button className={`mode-btn ${mode === "upload" ? "active" : ""}`}
              onClick={() => setMode("upload")}>
              Upload
            </button>
          </div>

          {mode === "paste" && (
            <textarea
              className="resume-textarea"
              placeholder="Paste resume..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />
          )}

          {mode === "upload" && (
            <div className="drop-zone"
              onClick={() => fileInputRef.current.click()}>
              <input
                type="file"
                hidden
                ref={fileInputRef}
                onChange={(e) => setPdfFile(e.target.files[0])}
              />
              {pdfFile ? pdfFile.name : "Click to upload PDF"}
            </div>
          )}

          {error && <p style={{ color: "#fb7185" }}>{error}</p>}

          <button className="analyze-btn" onClick={handleAnalyze}>
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

          <div className="card">
            <h3 className="section-heading strengths-heading">Strengths</h3>
            <ul>
              {result.strengths.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>

          <div className="card">
            <h3 className="section-heading improvements-heading">Improvements</h3>
            <ul>
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