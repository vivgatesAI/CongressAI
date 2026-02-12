"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "@/styles/Home.module.css";

const DEFAULT_MODEL = "kimi-k2-5";

function Section({ title, children }) {
  return (
    <div className={styles.section}>
      <h2>{title}</h2>
      <div className={styles.sectionBody}>{children}</div>
    </div>
  );
}

function JsonBlock({ data }) {
  if (!data) return null;
  return (
    <pre className={styles.jsonBlock}>{JSON.stringify(data, null, 2)}</pre>
  );
}

export default function Home() {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [file, setFile] = useState(null);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [agendaJson, setAgendaJson] = useState(null);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: "system", content: "You are a congress agenda assistant." },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [sessionEmbeddings, setSessionEmbeddings] = useState(null);
  const [semanticQuery, setSemanticQuery] = useState("");
  const [semanticResults, setSemanticResults] = useState([]);

  useEffect(() => {
    fetch("/api/models")
      .then((r) => r.json())
      .then((data) => {
        const textModels = data.data?.filter((m) => m.type === "text") || [];
        setModels(textModels);
      })
      .catch(() => setModels([]));
  }, []);

  const agendaContext = useMemo(() => {
    if (!agendaJson) return null;
    return JSON.stringify(agendaJson).slice(0, 8000);
  }, [agendaJson]);

  async function handlePdfAnalyze(e) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/analyze/pdf", { method: "POST", body: form });
    const data = await res.json();
    setAgendaJson(data);
    setSummary(data?.highlights?.join("\n") || "");
    setSessionEmbeddings(null);
    setSemanticResults([]);
    setLoading(false);
  }

  async function handleWebsiteAnalyze(e) {
    e.preventDefault();
    if (!websiteUrl) return;
    setLoading(true);
    const res = await fetch("/api/analyze/website", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: websiteUrl }),
    });
    const data = await res.json();
    setAgendaJson(data);
    setSummary(data?.highlights?.join("\n") || "");
    setSessionEmbeddings(null);
    setSemanticResults([]);
    setLoading(false);
  }

  async function handleScreenshotAnalyze(e) {
    e.preventDefault();
    if (!imageFile) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const res = await fetch("/api/analyze/screenshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: reader.result }),
      });
      const data = await res.json();
      setAgendaJson(data);
      setSummary(data?.highlights?.join("\n") || "");
      setSessionEmbeddings(null);
      setSemanticResults([]);
      setLoading(false);
    };
    reader.readAsDataURL(imageFile);
  }

  async function handleChatSend() {
    if (!chatInput.trim()) return;
    const next = [...chatMessages, { role: "user", content: chatInput }];
    setChatMessages(next);
    setChatInput("");

    const systemAugmented = agendaContext
      ? [{ role: "system", content: `You have this agenda context: ${agendaContext}` }, ...next]
      : next;

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: systemAugmented, model: selectedModel }),
    });
    const data = await res.json();
    setChatMessages([...next, { role: "assistant", content: data.content }]);
  }

  async function handleTTS() {
    if (!summary) return;
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: summary, voice: "af_nova", speed: 1.0 }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "summary.mp3";
    a.click();
  }

  async function handleEmbedSessions() {
    if (!agendaJson?.sessions?.length) return;
    const texts = agendaJson.sessions.map((s) => `${s.title} ${s.abstract || ""} ${s.topics?.join(" ") || ""}`);
    const res = await fetch("/api/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: texts }),
    });
    const data = await res.json();
    setSessionEmbeddings(data.data || []);
  }

  function cosineSim(a, b) {
    let dot = 0;
    let na = 0;
    let nb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
  }

  async function handleSemanticSearch() {
    if (!semanticQuery || !sessionEmbeddings?.length) return;
    const res = await fetch("/api/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: semanticQuery }),
    });
    const data = await res.json();
    const q = data.data?.[0]?.embedding;
    if (!q) return;
    const scored = sessionEmbeddings.map((e, idx) => ({
      idx,
      score: cosineSim(q, e.embedding),
    })).sort((a, b) => b.score - a.score).slice(0, 5);

    const results = scored.map((s) => ({
      score: s.score,
      session: agendaJson.sessions[s.idx],
    }));
    setSemanticResults(results);
  }

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>CongressAI</h1>
          <p>Upload a congress agenda or crawl a congress website to extract structured data.</p>
        </div>
        <div className={styles.modelSelect}>
          <label>Chat Model</label>
          <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
            <option value={DEFAULT_MODEL}>{DEFAULT_MODEL}</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>{m.id}</option>
            ))}
          </select>
        </div>
      </header>

      <div className={styles.grid}>
        <Section title="Analyze PDF Agenda">
          <form onSubmit={handlePdfAnalyze} className={styles.form}>
            <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <button type="submit" disabled={loading}>Analyze PDF</button>
          </form>
        </Section>

        <Section title="Analyze Website (agenda + abstracts)">
          <form onSubmit={handleWebsiteAnalyze} className={styles.form}>
            <input type="url" placeholder="https://conference.org/agenda" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
            <button type="submit" disabled={loading}>Analyze Website</button>
          </form>
        </Section>

        <Section title="Analyze Screenshot">
          <form onSubmit={handleScreenshotAnalyze} className={styles.form}>
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
            <button type="submit" disabled={loading}>Analyze Screenshot</button>
          </form>
        </Section>
      </div>

      <Section title="Structured Agenda JSON">
        <JsonBlock data={agendaJson} />
      </Section>

      <Section title="Highlights Summary">
        <textarea className={styles.textarea} value={summary} onChange={(e) => setSummary(e.target.value)} rows={6} />
        <div className={styles.actions}>
          <button onClick={handleTTS} disabled={!summary}>Download Audio Summary</button>
        </div>
      </Section>

      <Section title="Semantic Search (Embeddings)">
        <div className={styles.form}>
          <button onClick={handleEmbedSessions} disabled={!agendaJson?.sessions?.length}>Index Sessions</button>
          <input value={semanticQuery} onChange={(e) => setSemanticQuery(e.target.value)} placeholder="Query sessions (e.g., CAR-T, oncology, biomarkers)" />
          <button onClick={handleSemanticSearch} disabled={!sessionEmbeddings?.length}>Search</button>
        </div>
        <div className={styles.semanticResults}>
          {semanticResults.map((r, i) => (
            <div key={i} className={styles.semanticCard}>
              <div><strong>Score:</strong> {r.score.toFixed(3)}</div>
              <div><strong>{r.session?.title}</strong></div>
              <div>{r.session?.abstract}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Chat with the Agenda">
        <div className={styles.chatWindow}>
          {chatMessages.map((m, i) => (
            <div key={i} className={m.role === "user" ? styles.chatUser : styles.chatBot}>
              <strong>{m.role === "user" ? "You" : "Assistant"}:</strong> {m.content}
            </div>
          ))}
        </div>
        <div className={styles.chatInput}>
          <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask about sessions, speakers, or topics..." />
          <button onClick={handleChatSend}>Send</button>
        </div>
      </Section>
    </main>
  );
}
