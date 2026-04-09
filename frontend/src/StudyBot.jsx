import { useState, useRef, useEffect } from "react";
import "./studybot.css";

const API = "http://localhost:8000";

function useSession() {
  const [sessionId, setSessionId] = useState(null);
  useEffect(() => {
    fetch(`${API}/session`, { method: "POST" })
      .then((r) => r.json())
      .then((d) => setSessionId(d.session_id));
  }, []);
  return sessionId;
}

function VerdictBadge({ verdict }) {
  const map = {
    yes: { label: "Yes", cls: "badge-yes" },
    no: { label: "No", cls: "badge-no" },
    answered: { label: "Answered", cls: "badge-answered" },
    not_found: { label: "Not in docs", cls: "badge-notfound" },
  };
  const v = map[verdict] ?? { label: verdict, cls: "badge-answered" };
  return <span className={`badge ${v.cls}`}>{v.label}</span>;
}

function ProofPoints({ sources, onSourceClick }) {
  if (!sources || sources.length === 0) return null;
  return (
    <div className="proof-section">
      <div className="proof-title">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Points used to prove this
      </div>
      <div className="proof-points">
        {sources.map((s, i) => (
          <div key={i} className="proof-point">
            <div className="proof-point-number">{i + 1}</div>
            <div className="proof-point-body">
              <p className="proof-point-excerpt">"{s.excerpt}"</p>
              <button
                className="proof-point-source"
                onClick={() => onSourceClick(s)}
                title="Click to view this page/slide"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="1" width="10" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <line x1="5" y1="5" x2="9" y2="5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  <line x1="5" y1="8" x2="9" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                {s.doc_name} — {s.location}
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{marginLeft: 4}}>
                  <path d="M4 2h6v6M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConclusionBox({ verdict, explanation, questionType }) {
  const isYesNo = questionType === "yes_no";
  const icon = verdict === "yes" ? "✓" : verdict === "no" ? "✗" : "→";
  const cls = verdict === "yes" ? "conclusion-yes" : verdict === "no" ? "conclusion-no" : "conclusion-neutral";
  return (
    <div className={`conclusion-box ${cls}`}>
      <div className="conclusion-icon">{icon}</div>
      <div className="conclusion-body">
        <div className="conclusion-label">
          {isYesNo ? "Conclusion" : "Answer"}
        </div>
        <p className="conclusion-text">{explanation}</p>
      </div>
    </div>
  );
}

function DocViewer({ doc, onClose }) {
  if (!doc) return null;
  const isPdf = doc.name?.toLowerCase().endsWith(".pdf");
  const pageNum = doc.page || 1;

  return (
    <div className="viewer-overlay" onClick={onClose}>
      <div className="viewer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="viewer-header">
          <div className="viewer-title">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="1" width="10" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            {doc.name} — {doc.location}
          </div>
          <button className="viewer-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="viewer-body">
          {isPdf ? (
            <iframe
              src={`${API}/view-doc/${encodeURIComponent(doc.session_id)}/${encodeURIComponent(doc.name)}#page=${pageNum}`}
              className="viewer-iframe"
              title="Document viewer"
            />
          ) : (
            <div className="viewer-pptx-msg">
              <div className="viewer-pptx-icon">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <rect x="4" y="2" width="26" height="34" rx="4" stroke="currentColor" strokeWidth="1.5"/>
                  <line x1="10" y1="12" x2="24" y2="12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  <line x1="10" y1="18" x2="24" y2="18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  <line x1="10" y1="24" x2="18" y2="24" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </div>
              <p>Content from <strong>{doc.name}</strong></p>
              <p className="viewer-location-label">{doc.location}</p>
              <blockquote className="viewer-excerpt">"{doc.excerpt}"</blockquote>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AnswerCard({ item, onSourceClick }) {
  const [showPoints, setShowPoints] = useState(true);
  return (
    <div className={`answer-card ${item.verdict === "not_found" ? "answer-card--notfound" : ""}`}>
      <div className="answer-top">
        <div className="answer-question">
          <span className="q-mark">?</span>
          <span>{item.question}</span>
        </div>
        <VerdictBadge verdict={item.verdict} />
      </div>

      <ConclusionBox
        verdict={item.verdict}
        explanation={item.explanation}
        questionType={item.question_type}
      />

      {item.sources?.length > 0 && (
        <>
          <button className="sources-toggle" onClick={() => setShowPoints((o) => !o)}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: showPoints ? "rotate(90deg)" : "none", transition: "transform .2s" }}>
              <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {showPoints ? "Hide" : "Show"} proof points ({item.sources.length})
          </button>
          {showPoints && (
            <ProofPoints sources={item.sources} onSourceClick={onSourceClick} />
          )}
        </>
      )}
    </div>
  );
}

function DocPill({ doc }) {
  return (
    <div className="doc-pill">
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="1" width="10" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="5" y1="5" x2="9" y2="5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        <line x1="5" y1="8" x2="9" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
      <span>{doc.name}</span>
      <span className="doc-chunks">{doc.chunks} chunks</span>
    </div>
  );
}

export default function App() {
  const sessionId = useSession();
  const [docs, setDocs] = useState([]);
  const [history, setHistory] = useState([]);
  const [question, setQuestion] = useState("");
  const [uploading, setUploading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);
  const [viewerDoc, setViewerDoc] = useState(null);
  const fileRef = useRef();
  const bottomRef = useRef();
  const inputRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, asking]);

  async function uploadFile(file) {
    if (!sessionId) return;
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await fetch(`${API}/upload/${sessionId}`, { method: "POST", body: fd });
      if (!r.ok) {
        const e = await r.json();
        throw new Error(e.detail || "Upload failed");
      }
      const d = await r.json();
      setDocs((prev) => {
        const existing = prev.find((x) => x.name === d.doc_name);
        if (existing) return prev.map((x) => x.name === d.doc_name ? { ...x, chunks: d.chunks_added } : x);
        return [...prev, { name: d.doc_name, chunks: d.chunks_added }];
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleAsk(e) {
    e.preventDefault();
    if (!question.trim() || asking || !sessionId || docs.length === 0) return;
    const q = question.trim();
    setQuestion("");
    setAsking(true);
    setError(null);
    try {
      const r = await fetch(`${API}/ask/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      if (!r.ok) {
        const e = await r.json();
        throw new Error(e.detail || "Request failed");
      }
      const d = await r.json();
      setHistory((h) => [...h, { question: q, ...d }]);
    } catch (e) {
      setError(e.message);
    } finally {
      setAsking(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  function handleSourceClick(source) {
    setViewerDoc({ ...source, session_id: sessionId });
  }

  const canAsk = docs.length > 0 && !asking && !!sessionId;

  return (
    <div className="app">
      {viewerDoc && (
        <DocViewer doc={viewerDoc} onClose={() => setViewerDoc(null)} />
      )}

      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-dot" />
          <span>StudyBot</span>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-label">Your documents</div>
          <div
            className={`drop-zone ${dragOver ? "drop-zone--active" : ""} ${uploading ? "drop-zone--loading" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.pptx,.ppt"
              style={{ display: "none" }}
              onChange={(e) => e.target.files[0] && uploadFile(e.target.files[0])}
            />
            {uploading ? (
              <div className="upload-spinner" />
            ) : (
              <>
                <svg className="upload-icon" width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M12 16V8M12 8l-3 3M12 8l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                <span className="upload-text">Drop PDF or PPTX<br /><small>or click to browse</small></span>
              </>
            )}
          </div>

          {docs.length > 0 && (
            <div className="docs-list">
              {docs.map((d, i) => <DocPill key={i} doc={d} />)}
            </div>
          )}
        </div>

        <div className="sidebar-section sidebar-hint">
          <div className="sidebar-label">How it works</div>
          <ol className="hint-list">
            <li>Upload your PDF or PPT</li>
            <li>Ask any doubt about it</li>
            <li>Get verdict + proof points</li>
            <li>Click a source to view the page</li>
          </ol>
        </div>
      </aside>

      <main className="main">
        <div className="chat-area">
          {history.length === 0 && !asking && (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="1.5" opacity=".3"/>
                  <path d="M16 20c0-4.418 3.582-8 8-8s8 3.582 8 8c0 3.2-1.888 5.984-4.64 7.36L27 30h-6l-.36-2.64C17.888 25.984 16 23.2 16 20Z" stroke="currentColor" strokeWidth="1.5"/>
                  <line x1="21" y1="34" x2="27" y2="34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="22" y1="37" x2="26" y2="37" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              {docs.length === 0 ? (
                <>
                  <h2>Upload a document to begin</h2>
                  <p>Add a PDF or PowerPoint from the sidebar, then ask your first doubt.</p>
                </>
              ) : (
                <>
                  <h2>Ready for your doubts</h2>
                  <p>Ask anything about <strong>{docs.map(d => d.name).join(", ")}</strong></p>
                  <div className="example-qs">
                    {["What is machine learning?", "Does deep learning help in image recognition?", "What are the types of supervised learning?"].map((q) => (
                      <button key={q} className="example-q" onClick={() => { setQuestion(q); setTimeout(() => inputRef.current?.focus(), 50); }}>
                        {q}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {history.map((item, i) => (
            <AnswerCard key={i} item={item} onSourceClick={handleSourceClick} />
          ))}

          {asking && (
            <div className="thinking-card">
              <div className="thinking-dots">
                <span /><span /><span />
              </div>
              <span>Searching your documents…</span>
            </div>
          )}

          {error && <div className="error-banner">{error}</div>}
          <div ref={bottomRef} />
        </div>

        <form className="input-bar" onSubmit={handleAsk}>
          <input
            ref={inputRef}
            className="input-field"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={docs.length === 0 ? "Upload a document first…" : "Ask a doubt about your document…"}
            disabled={!canAsk}
          />
          <button className="send-btn" type="submit" disabled={!canAsk || !question.trim()}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M4 10h12M12 6l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </form>
      </main>
    </div>
  );
}