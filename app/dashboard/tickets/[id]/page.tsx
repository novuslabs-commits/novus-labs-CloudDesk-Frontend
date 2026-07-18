"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Ticket, Agent } from "@/lib/types";
import api from "@/lib/api";
import {
  ArrowLeft, AlertTriangle, CheckCircle,
  Copy, User, Clock, Tag, Zap, MessageSquare
} from "lucide-react";

const URGENCY_COLORS: Record<string, { bg: string; text: string }> = {
  high: { bg: "rgba(239,68,68,0.12)", text: "#f87171" },
  medium: { bg: "rgba(245,158,11,0.12)", text: "#fbbf24" },
  low: { bg: "rgba(34,197,94,0.12)", text: "#4ade80" },
};
const SENTIMENT_COLORS: Record<string, { bg: string; text: string }> = {
  positive: { bg: "rgba(34,197,94,0.12)", text: "#4ade80" },
  neutral: { bg: "rgba(107,114,128,0.12)", text: "#9ca3af" },
  negative: { bg: "rgba(239,68,68,0.12)", text: "#f87171" },
};
const INTENT_COLORS: Record<string, { bg: string; text: string }> = {
  billing: { bg: "rgba(59,130,246,0.12)", text: "#60a5fa" },
  technical: { bg: "rgba(139,92,246,0.12)", text: "#a78bfa" },
  feature_request: { bg: "rgba(99,102,241,0.12)", text: "#818cf8" },
  complaint: { bg: "rgba(239,68,68,0.12)", text: "#f87171" },
  refund: { bg: "rgba(249,115,22,0.12)", text: "#fb923c" },
  account_access: { bg: "rgba(20,184,166,0.12)", text: "#2dd4bf" },
  general: { bg: "rgba(107,114,128,0.12)", text: "#9ca3af" },
};
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  open: { bg: "rgba(59,130,246,0.12)", text: "#60a5fa" },
  in_progress: { bg: "rgba(245,158,11,0.12)", text: "#fbbf24" },
  resolved: { bg: "rgba(34,197,94,0.12)", text: "#4ade80" },
  closed: { bg: "rgba(107,114,128,0.12)", text: "#9ca3af" },
};

const cardStyle = { background: "#16161f", border: "1px solid #1e1e2e", borderRadius: "16px" };
const fieldStyle = { background: "#16161f", border: "1px solid #2a2a3e", color: "#f1f5f9" };

function Badge({ bg, text, children }: { bg: string; text: string; children: React.ReactNode }) {
  return (
    <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "999px", fontWeight: 500, background: bg, color: text, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

const INTENT_OPTIONS = ["billing", "technical", "feature_request", "complaint", "refund", "account_access", "general"];

export default function TicketDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [generatedResponse, setGeneratedResponse] = useState("");
  const [generating, setGenerating] = useState(false);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [assignedAgent, setAssignedAgent] = useState<Agent | null>(null);
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [selectedIntent, setSelectedIntent] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingAgent, setUpdatingAgent] = useState(false);
  const [activeTab, setActiveTab] = useState<"classification" | "templates" | "feedback">("classification");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [ticketRes, agentsRes, suggestionsRes] = await Promise.all([
          api.get(`/tickets/${id}`),
          api.get("/agents"),
          api.get(`/tickets/${id}/suggestions`),
        ]);
        const t = ticketRes.data;
        setTicket(t);
        setAllAgents(agentsRes.data);
        setSuggestions(suggestionsRes.data);
        if (t.assigned_agent_id) {
          const agent = agentsRes.data.find((a: Agent) => a.id === t.assigned_agent_id);
          if (agent) setAssignedAgent(agent);
        }
        try {
          const fbRes = await api.get("/feedback");
          const existing = fbRes.data.find((f: any) => f.ticket_id === Number(id));
          if (existing) setFeedbackSubmitted(true);
        } catch {}
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  const updateStatus = async (status: string) => {
    setUpdatingStatus(true);
    try {
      const res = await api.patch(`/tickets/${id}/status`, { status });
      setTicket(res.data);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const updateAgent = async (agentId: string) => {
    setUpdatingAgent(true);
    try {
      const res = await api.patch(`/tickets/${id}/assign`, null, { params: { agent_id: Number(agentId) } });
      setTicket(res.data);
      const agent = allAgents.find(a => a.id === Number(agentId));
      if (agent) setAssignedAgent(agent);
    } finally {
      setUpdatingAgent(false);
    }
  };

  const submitFeedback = async () => {
    if (!selectedIntent) return;
    try {
      await api.post("/feedback", { ticket_id: Number(id), correct_intent: selectedIntent });
      setFeedbackSubmitted(true);
    } catch (err: any) {
      if (err.response?.data?.detail?.includes("already submitted")) setFeedbackSubmitted(true);
    }
  };

  const copyTemplate = (body: string, templateId: number) => {
    navigator.clipboard.writeText(body);
    setCopiedId(templateId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) return (
    <div style={{ padding: "32px", display: "flex", alignItems: "center", gap: "10px", color: "#6b7280", fontSize: "13px" }}>
      <div className="animate-spin" style={{ height: "16px", width: "16px", borderRadius: "999px", border: "2px solid #6366f1", borderTopColor: "transparent" }} />
      Loading ticket...
    </div>
  );
  if (!ticket) return <div style={{ padding: "32px", color: "#6b7280" }}>Ticket not found.</div>;

  const confidencePct = ((ticket.confidence || 0) * 100).toFixed(1);
  const confidenceColor = (ticket.confidence || 0) >= 0.85 ? "#4ade80" : (ticket.confidence || 0) >= 0.70 ? "#fbbf24" : "#ef4444";
  const statusC = STATUS_COLORS[ticket.status];
  const intentC = INTENT_COLORS[ticket.intent || "general"];
  const urgencyC = URGENCY_COLORS[ticket.urgency || "low"];
  const sentimentC = SENTIMENT_COLORS[ticket.sentiment || "neutral"];

  const tabs = [
    { key: "classification", label: "Classification" },
    { key: "templates", label: `Templates${suggestions.length > 0 ? ` (${suggestions.length})` : ""}` },
    { key: "feedback", label: "Feedback" },
  ];

  return (
    <div style={{ padding: "32px" }}>

      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <button onClick={() => router.back()}
          style={{ display: "flex", alignItems: "center", gap: "8px", background: "transparent", border: "none", color: "#9ca3af", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
          <ArrowLeft style={{ height: "16px", width: "16px" }} /> Back to Queue
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
  {ticket.status === "open" && (
    <button
      onClick={() => router.push(`/dashboard/tickets/${ticket.id}/process`)}
      style={{
        display: "flex", alignItems: "center", gap: "6px",
        padding: "8px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, color: "#fff",
        background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", cursor: "pointer",
      }}
    >
      Respond to Ticket
    </button>
  )}
  <span style={{ fontSize: "12px", color: "#6b7280" }}>Status</span>
  <select value={ticket.status} disabled={updatingStatus} onChange={e => updateStatus(e.target.value)}
    style={{ ...fieldStyle, borderRadius: "8px", padding: "6px 10px", fontSize: "12px", outline: "none" }}>
    <option value="open">Open</option>
    <option value="in_progress">In Progress</option>
    <option value="resolved">Resolved</option>
    <option value="closed">Closed</option>
  </select>
</div>
      </div>

      {/* Title block */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <span style={{ fontSize: "12px", color: "#4b5563", fontFamily: "monospace" }}>#{ticket.id}</span>
          {ticket.needs_review && (
            <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "#fbbf24", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", padding: "3px 10px", borderRadius: "999px" }}>
              <AlertTriangle style={{ height: "11px", width: "11px" }} /> Needs Review
            </span>
          )}
          <Badge bg={statusC.bg} text={statusC.text}>{ticket.status.replace("_", " ")}</Badge>
        </div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#fff", marginBottom: "8px" }}>{ticket.subject}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px", color: "#6b7280" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Clock style={{ height: "12px", width: "12px" }} />
            {new Date(ticket.created_at ).toLocaleString("en-PK", { timeZone: "Asia/Karachi" })}
          </span>
          <span>·</span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Tag style={{ height: "12px", width: "12px" }} /> via {ticket.source}
          </span>
          {ticket.resolved_at && (
            <>
              <span>·</span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#4ade80" }}>
                <CheckCircle style={{ height: "12px", width: "12px" }} />
                Resolved {new Date(ticket.resolved_at ).toLocaleString("en-PK", { timeZone: "Asia/Karachi" })}
              </span>
            </>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>

        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Customer message */}
          <div style={{ ...cardStyle, padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <MessageSquare style={{ height: "15px", width: "15px", color: "#818cf8" }} />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>Customer Message</span>
            </div>
            <p style={{ fontSize: "13px", lineHeight: 1.7, color: "#d1d5db", whiteSpace: "pre-wrap" }}>{ticket.body}</p>
          </div>

          {/* Tabs */}
          <div>
            <div style={{ display: "flex", gap: "6px", padding: "4px", borderRadius: "12px", background: "#16161f", border: "1px solid #1e1e2e", marginBottom: "16px", width: "fit-content" }}>
              {tabs.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key as any)}
                  style={{
                    padding: "7px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, cursor: "pointer",
                    background: activeTab === t.key ? "rgba(99,102,241,0.15)" : "transparent",
                    color: activeTab === t.key ? "#818cf8" : "#6b7280",
                    border: activeTab === t.key ? "1px solid rgba(99,102,241,0.25)" : "1px solid transparent",
                  }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Classification tab */}
            {activeTab === "classification" && (
              <div style={{ ...cardStyle, padding: "24px" }}>
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                    <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Predicted Intent</p>
                    <Badge bg={intentC.bg} text={intentC.text}>{ticket.intent?.replace("_", " ")}</Badge>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ flex: 1, height: "10px", borderRadius: "999px", background: "#1e1e2e", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: "999px", width: `${confidencePct}%`, background: confidenceColor, transition: "width 0.6s" }} />
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#fff", width: "50px", textAlign: "right" }}>{confidencePct}%</span>
                  </div>
                  <p style={{ fontSize: "11px", color: "#6b7280", marginTop: "6px" }}>
                    {(ticket.confidence || 0) >= 0.85 ? "High confidence — reliable classification"
                      : (ticket.confidence || 0) >= 0.70 ? "Medium confidence — verify if needed"
                      : "Low confidence — manual review recommended"}
                  </p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", paddingTop: "16px", borderTop: "1px solid #1e1e2e" }}>
                  <div>
                    <p style={{ fontSize: "11px", color: "#6b7280", marginBottom: "6px" }}>Urgency</p>
                    <Badge bg={urgencyC.bg} text={urgencyC.text}>{ticket.urgency}</Badge>
                  </div>
                  <div>
                    <p style={{ fontSize: "11px", color: "#6b7280", marginBottom: "6px" }}>Sentiment</p>
                    <Badge bg={sentimentC.bg} text={sentimentC.text}>{ticket.sentiment} ({ticket.sentiment_score?.toFixed(2)})</Badge>
                  </div>
                  <div>
                    <p style={{ fontSize: "11px", color: "#6b7280", marginBottom: "6px" }}>Routed to</p>
                    <span style={{ fontSize: "12px", fontWeight: 500, color: "#fff" }}>{ticket.assigned_team}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Templates tab */}
            {activeTab === "templates" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                {/* AI Response Generator */}
                <div style={{ ...cardStyle, padding: "20px", border: "1px solid rgba(99,102,241,0.25)", background: "rgba(99,102,241,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                    <Zap style={{ height: "15px", width: "15px", color: "#818cf8" }} />
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>AI Response Generator</span>
                  </div>
                  {generatedResponse ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={{ padding: "14px", background: "#111118", border: "1px solid #1e1e2e", borderRadius: "10px", fontSize: "13px", lineHeight: 1.7, color: "#d1d5db", whiteSpace: "pre-wrap" }}>
                        {generatedResponse}
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => { navigator.clipboard.writeText(generatedResponse); setCopiedId(-1); setTimeout(() => setCopiedId(null), 2000); }}
                          style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, cursor: "pointer",
                            background: copiedId === -1 ? "rgba(74,222,128,0.15)" : "transparent",
                            color: copiedId === -1 ? "#4ade80" : "#9ca3af",
                            border: "1px solid #2a2a3e" }}>
                          {copiedId === -1 ? <><CheckCircle style={{ height: "12px", width: "12px" }} /> Copied</> : <><Copy style={{ height: "12px", width: "12px" }} /> Copy Response</>}
                        </button>
                        <button onClick={() => setGeneratedResponse("")}
                          style={{ padding: "7px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, cursor: "pointer", background: "transparent", color: "#6b7280", border: "none" }}>
                          Regenerate
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "12px" }}>
                        Generate a tailored response based on this specific ticket's content and classification.
                      </p>
                      <button
                        disabled={generating}
                        onClick={async () => {
                          setGenerating(true);
                          try {
                            const res = await api.post(`/tickets/${id}/generate-response`);
                            setGeneratedResponse(res.data.response);
                          } catch {
                            setGeneratedResponse("Failed to generate response. Please try again.");
                          } finally {
                            setGenerating(false);
                          }
                        }}
                        style={{ display: "flex", alignItems: "center", gap: "8px", padding: "9px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, color: "#fff",
                          background: generating ? "rgba(99,102,241,0.5)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                          border: "none", cursor: generating ? "not-allowed" : "pointer" }}>
                        {generating ? (
                          <><div className="animate-spin" style={{ height: "12px", width: "12px", borderRadius: "999px", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff" }} /> Generating...</>
                        ) : (
                          <><Zap style={{ height: "13px", width: "13px" }} /> Generate AI Response</>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Template suggestions */}
                {suggestions.length === 0 ? (
                  <div style={{ ...cardStyle, padding: "20px", fontSize: "13px", color: "#6b7280" }}>
                    No template suggestions available for this ticket.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", paddingLeft: "4px" }}>
                      Similar Templates
                    </p>
                    {suggestions.map((s, i) => (
                      <div key={s.template_id} style={{ ...cardStyle, padding: "16px" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "8px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#4b5563" }}>#{i + 1}</span>
                            <span style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>{s.title}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                            <span style={{ fontSize: "11px", color: "#4b5563" }}>{(s.similarity * 100).toFixed(0)}% match</span>
                            <button onClick={() => copyTemplate(s.body, s.template_id)}
                              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "5px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: 500, cursor: "pointer",
                                background: copiedId === s.template_id ? "rgba(74,222,128,0.15)" : "rgba(99,102,241,0.1)",
                                color: copiedId === s.template_id ? "#4ade80" : "#818cf8",
                                border: "1px solid #2a2a3e" }}>
                              {copiedId === s.template_id ? <><CheckCircle style={{ height: "11px", width: "11px" }} /> Copied</> : <><Copy style={{ height: "11px", width: "11px" }} /> Use Template</>}
                            </button>
                          </div>
                        </div>
                        <p style={{ fontSize: "12px", lineHeight: 1.6, color: "#6b7280" }}>{s.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Feedback tab */}
            {activeTab === "feedback" && (
              <div style={{ ...cardStyle, padding: "20px" }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#fff", marginBottom: "16px" }}>Classification Feedback</p>
                {feedbackSubmitted ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#4ade80", fontSize: "13px" }}>
                    <CheckCircle style={{ height: "15px", width: "15px" }} />
                    Feedback submitted — this will improve future classifications
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div style={{ padding: "12px", background: "#111118", borderRadius: "10px", fontSize: "13px" }}>
                      <p style={{ fontSize: "11px", color: "#6b7280", marginBottom: "4px" }}>Current classification</p>
                      <p style={{ fontWeight: 600, color: "#fff" }}>{ticket.intent?.replace("_", " ")} · {confidencePct}% confidence</p>
                    </div>
                    <div>
                      <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px" }}>If incorrect, select the right intent:</p>
                      <select value={selectedIntent} onChange={e => setSelectedIntent(e.target.value)}
                        style={{ ...fieldStyle, width: "100%", padding: "10px 12px", borderRadius: "10px", fontSize: "13px", outline: "none", boxSizing: "border-box", marginBottom: "10px" }}>
                        <option value="">Select correct intent...</option>
                        {INTENT_OPTIONS.map(intent => (
                          <option key={intent} value={intent}>{intent.replace("_", " ")}</option>
                        ))}
                      </select>
                      <button onClick={submitFeedback} disabled={!selectedIntent}
                        style={{ width: "100%", padding: "10px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, color: "#fff",
                          background: !selectedIntent ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                          border: "none", cursor: !selectedIntent ? "not-allowed" : "pointer" }}>
                        Submit Feedback
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Ticket details */}
          <div style={{ ...cardStyle, padding: "20px" }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "#fff", marginBottom: "14px" }}>Ticket Details</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { label: "ID", value: `#${ticket.id}` },
                { label: "Status", value: ticket.status.replace("_", " ") },
                { label: "Source", value: ticket.source },
                { label: "Intent", value: ticket.intent?.replace("_", " ") || "—" },
                { label: "Team", value: ticket.assigned_team || "—" },
                { label: "Confidence", value: `${confidencePct}%` },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", color: "#6b7280" }}>{label}</span>
                  <span style={{ fontSize: "12px", fontWeight: 500, color: "#fff" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Agent assignment */}
          <div style={{ ...cardStyle, padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <User style={{ height: "14px", width: "14px", color: "#818cf8" }} />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>Assigned Agent</span>
            </div>
            {assignedAgent && (
              <div style={{ padding: "12px", background: "#111118", borderRadius: "10px", marginBottom: "14px" }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>{assignedAgent.name}</p>
                <p style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>{assignedAgent.email}</p>
                <p style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>{assignedAgent.team}</p>
              </div>
            )}
            <div>
              <p style={{ fontSize: "11px", color: "#6b7280", marginBottom: "8px" }}>Reassign to</p>
              <select value={ticket.assigned_agent_id?.toString() || ""} disabled={updatingAgent} onChange={e => updateAgent(e.target.value)}
                style={{ ...fieldStyle, width: "100%", padding: "8px 10px", borderRadius: "8px", fontSize: "12px", outline: "none", boxSizing: "border-box" }}>
                <option value="">Select agent...</option>
                {allAgents.map(agent => (
                  <option key={agent.id} value={agent.id.toString()}>{agent.name} · {agent.team}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Resolution */}
{(ticket.initial_response_text || ticket.resolution_note) && (
  <div style={{ ...cardStyle, padding: "20px" }}>
    <p style={{ fontSize: "13px", fontWeight: 600, color: "#fff", marginBottom: "14px" }}>Resolution</p>

    {ticket.initial_response_text && (
      <div style={{ marginBottom: "14px" }}>
        <p style={{ fontSize: "11px", color: "#6b7280", marginBottom: "6px" }}>Initial response sent</p>
        <div style={{ padding: "10px", background: "#111118", borderRadius: "10px", fontSize: "12px", lineHeight: 1.6, color: "#9ca3af" }}>
          {ticket.initial_response_text}
        </div>
        {ticket.initial_response_sent_at && (
          <p style={{ fontSize: "10px", color: "#4b5563", marginTop: "6px" }}>
            {new Date(ticket.initial_response_sent_at ).toLocaleString("en-PK", { timeZone: "Asia/Karachi" })}
          </p>
        )}
      </div>
    )}

    {ticket.resolution_note && (
      <div>
        <p style={{ fontSize: "11px", color: "#6b7280", marginBottom: "6px" }}>Resolution note</p>
        <div style={{ padding: "10px", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: "10px", fontSize: "12px", lineHeight: 1.6, color: "#9ca3af" }}>
          {ticket.resolution_note}
        </div>
        {ticket.resolution_sent_at && (
          <p style={{ fontSize: "10px", color: "#4b5563", marginTop: "6px" }}>
            {new Date(ticket.resolution_sent_at ).toLocaleString("en-PK", { timeZone: "Asia/Karachi" })}
          </p>
        )}
      </div>
    )}
  </div>
)}

       {/* Timeline */}
       <div style={{ ...cardStyle, padding: "20px" }}>
  
        </div>
          {/* Timeline */}
          <div style={{ ...cardStyle, padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <Clock style={{ height: "14px", width: "14px", color: "#818cf8" }} />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>Timeline</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ height: "8px", width: "8px", borderRadius: "999px", background: "#6366f1", marginTop: "3px", flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: "12px", fontWeight: 500, color: "#fff" }}>Ticket created</p>
                  <p style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>
                    {new Date(ticket.created_at ).toLocaleString("en-PK", { timeZone: "Asia/Karachi" })}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ height: "8px", width: "8px", borderRadius: "999px", background: "#6366f1", marginTop: "3px", flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: "12px", fontWeight: 500, color: "#fff" }}>AI classified</p>
                  <p style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>
                    {ticket.intent?.replace("_", " ")} · {confidencePct}%
                  </p>
                </div>
              </div>
              {ticket.resolved_at && (
                <div style={{ display: "flex", gap: "12px" }}>
                  <div style={{ height: "8px", width: "8px", borderRadius: "999px", background: "#4ade80", marginTop: "3px", flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: "12px", fontWeight: 500, color: "#4ade80" }}>Resolved</p>
                    <p style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>
                      {new Date(ticket.resolved_at ).toLocaleString("en-PK", { timeZone: "Asia/Karachi" })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}