"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Ticket } from "@/lib/types";
import api from "@/lib/api";
import { ArrowLeft, Send, CheckCircle, Zap, Copy } from "lucide-react";

const cardStyle = { background: "#16161f", border: "1px solid #1e1e2e", borderRadius: "16px" };
const fieldStyle = { background: "#16161f", border: "1px solid #2a2a3e", color: "#f1f5f9" };

export default function ProcessTicketPage() {
  const { id } = useParams();
  const router = useRouter();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState<"respond" | "resolve" | "done">("respond");
  const [responseText, setResponseText] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [sending, setSending] = useState(false);

  const [resolutionNote, setResolutionNote] = useState("");
  const [resolving, setResolving] = useState(false);

  const [generatingAi, setGeneratingAi] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [ticketRes, suggestionsRes] = await Promise.all([
          api.get(`/tickets/${id}`),
          api.get(`/tickets/${id}/suggestions`),
        ]);
        setTicket(ticketRes.data);
        setSuggestions(suggestionsRes.data);

        if (ticketRes.data.initial_response_sent_at) {
          setStep(ticketRes.data.resolved_at ? "done" : "resolve");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  const useTemplate = (templateId: number, body: string) => {
    setSelectedTemplateId(templateId);
    setResponseText(body);
  };

  const generateAiResponse = async () => {
    setGeneratingAi(true);
    try {
      const res = await api.post(`/tickets/${id}/generate-response`);
      setResponseText(res.data.response);
      setSelectedTemplateId(null);
    } finally {
      setGeneratingAi(false);
    }
  };

  const sendResponse = async () => {
    if (!responseText.trim()) return;
    setSending(true);
    try {
      const res = await api.post(`/tickets/${id}/respond`, {
        template_id: selectedTemplateId,
        response_text: responseText,
      });
      setTicket(res.data);
      setStep("resolve");
    } finally {
      setSending(false);
    }
  };

  const resolveTicket = async () => {
    if (!resolutionNote.trim()) return;
    setResolving(true);
    try {
      const res = await api.post(`/tickets/${id}/resolve`, { resolution_note: resolutionNote });
      setTicket(res.data);
      setStep("done");
    } finally {
      setResolving(false);
    }
  };

  if (loading) return (
    <div style={{ padding: "32px", color: "#6b7280", fontSize: "13px" }}>Loading ticket...</div>
  );
  if (!ticket) return <div style={{ padding: "32px", color: "#6b7280" }}>Ticket not found.</div>;

  return (
    <div style={{ padding: "32px", maxWidth: "760px" }}>

      <button onClick={() => router.back()}
        style={{ display: "flex", alignItems: "center", gap: "8px", background: "transparent", border: "none", color: "#9ca3af", fontSize: "13px", fontWeight: 500, cursor: "pointer", marginBottom: "20px" }}>
        <ArrowLeft style={{ height: "16px", width: "16px" }} /> Back
      </button>

      {/* Progress steps */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
        {[
          { key: "respond", label: "Send Response" },
          { key: "resolve", label: "Resolve" },
          { key: "done", label: "Complete" },
        ].map((s, i) => {
          const isActive = step === s.key;
          const isDone = (s.key === "respond" && step !== "respond") || (s.key === "resolve" && step === "done");
          return (
            <div key={s.key} style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: "8px", padding: "6px 14px", borderRadius: "999px", fontSize: "12px", fontWeight: 600,
                background: isDone ? "rgba(74,222,128,0.12)" : isActive ? "rgba(99,102,241,0.15)" : "#16161f",
                color: isDone ? "#4ade80" : isActive ? "#818cf8" : "#4b5563",
                border: isDone ? "1px solid rgba(74,222,128,0.25)" : isActive ? "1px solid rgba(99,102,241,0.25)" : "1px solid #1e1e2e",
              }}>
                {isDone && <CheckCircle style={{ height: "12px", width: "12px" }} />}
                {s.label}
              </div>
              {i < 2 && <div style={{ flex: 1, height: "1px", background: "#1e1e2e" }} />}
            </div>
          );
        })}
      </div>

      {/* Ticket summary */}
      <div style={{ ...cardStyle, padding: "20px", marginBottom: "20px" }}>
        <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#fff", marginBottom: "8px" }}>{ticket.subject}</h1>
        <p style={{ fontSize: "13px", lineHeight: 1.6, color: "#9ca3af" }}>{ticket.body}</p>
      </div>

      {/* Step 1 — Respond */}
      {step === "respond" && (
        <div style={{ ...cardStyle, padding: "24px" }}>
          <p style={{ fontSize: "14px", fontWeight: 600, color: "#fff", marginBottom: "16px" }}>Send initial response</p>

          <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
            <button onClick={generateAiResponse} disabled={generatingAi}
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, color: "#fff",
                background: generatingAi ? "rgba(99,102,241,0.5)" : "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", cursor: generatingAi ? "not-allowed" : "pointer" }}>
              {generatingAi ? "Generating..." : <><Zap style={{ height: "12px", width: "12px" }} /> Generate AI Response</>}
            </button>
          </div>

          {suggestions.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <p style={{ fontSize: "11px", color: "#6b7280", marginBottom: "8px" }}>Or use a suggested template:</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {suggestions.map((s) => (
                  <button key={s.template_id} onClick={() => useTemplate(s.template_id, s.body)}
                    style={{
                      textAlign: "left", padding: "10px 12px", borderRadius: "10px", fontSize: "12px", cursor: "pointer",
                      background: selectedTemplateId === s.template_id ? "rgba(99,102,241,0.1)" : "#111118",
                      border: selectedTemplateId === s.template_id ? "1px solid rgba(99,102,241,0.3)" : "1px solid #1e1e2e",
                      color: "#9ca3af",
                    }}>
                    <span style={{ fontWeight: 600, color: "#fff" }}>{s.title}</span>
                    <span style={{ marginLeft: "8px", color: "#4b5563" }}>{(s.similarity * 100).toFixed(0)}% match</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <textarea
            value={responseText}
            onChange={e => setResponseText(e.target.value)}
            placeholder="Write your response to the customer..."
            rows={6}
            style={{ ...fieldStyle, width: "100%", padding: "12px", borderRadius: "12px", fontSize: "13px", lineHeight: 1.6, outline: "none", resize: "none", boxSizing: "border-box", marginBottom: "16px" }}
          />

          <button onClick={sendResponse} disabled={!responseText.trim() || sending}
            style={{
              display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, color: "#fff",
              background: !responseText.trim() || sending ? "rgba(99,102,241,0.4)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              border: "none", cursor: !responseText.trim() || sending ? "not-allowed" : "pointer",
            }}>
            <Send style={{ height: "14px", width: "14px" }} />
            {sending ? "Sending..." : "Send Response to Customer"}
          </button>
        </div>
      )}

      {/* Step 2 — Resolve */}
      {step === "resolve" && (
        <div style={{ ...cardStyle, padding: "24px" }}>
          <div style={{ padding: "12px", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: "10px", marginBottom: "20px" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "#4ade80", marginBottom: "4px" }}>Response sent to customer</p>
            <p style={{ fontSize: "12px", color: "#9ca3af" }}>{ticket.initial_response_text}</p>
          </div>

          <p style={{ fontSize: "14px", fontWeight: 600, color: "#fff", marginBottom: "16px" }}>Record resolution</p>
          <textarea
            value={resolutionNote}
            onChange={e => setResolutionNote(e.target.value)}
            placeholder="Describe how the issue was resolved..."
            rows={5}
            style={{ ...fieldStyle, width: "100%", padding: "12px", borderRadius: "12px", fontSize: "13px", lineHeight: 1.6, outline: "none", resize: "none", boxSizing: "border-box", marginBottom: "16px" }}
          />

          <button onClick={resolveTicket} disabled={!resolutionNote.trim() || resolving}
            style={{
              display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, color: "#fff",
              background: !resolutionNote.trim() || resolving ? "rgba(74,222,128,0.4)" : "linear-gradient(135deg, #22c55e, #16a34a)",
              border: "none", cursor: !resolutionNote.trim() || resolving ? "not-allowed" : "pointer",
            }}>
            <CheckCircle style={{ height: "14px", width: "14px" }} />
            {resolving ? "Resolving..." : "Mark as Resolved"}
          </button>
        </div>
      )}

      {/* Step 3 — Done */}
      {step === "done" && (
        <div style={{ ...cardStyle, padding: "32px", textAlign: "center" }}>
          <div style={{ height: "48px", width: "48px", borderRadius: "999px", background: "rgba(74,222,128,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <CheckCircle style={{ height: "24px", width: "24px", color: "#4ade80" }} />
          </div>
          <p style={{ fontSize: "16px", fontWeight: 700, color: "#fff", marginBottom: "6px" }}>Ticket Resolved</p>
          <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "20px" }}>
            {ticket.resolution_note}
          </p>
          <button onClick={() => router.push("/dashboard")}
            style={{ padding: "9px 20px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, color: "#fff",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", cursor: "pointer" }}>
            Back to Queue
          </button>
        </div>
      )}
    </div>
  );
}