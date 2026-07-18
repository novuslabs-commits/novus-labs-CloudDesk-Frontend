"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Search, Copy, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";

interface Template { id: number; title: string; body: string; intent: string; }

const INTENT_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  billing: { color: "#60a5fa", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.2)", label: "Billing" },
  technical: { color: "#a78bfa", bg: "rgba(139,92,246,0.12)", border: "rgba(139,92,246,0.2)", label: "Technical" },
  feature_request: { color: "#818cf8", bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.2)", label: "Feature Request" },
  complaint: { color: "#f87171", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.2)", label: "Complaint" },
  refund: { color: "#fb923c", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.2)", label: "Refund" },
  account_access: { color: "#2dd4bf", bg: "rgba(20,184,166,0.12)", border: "rgba(20,184,166,0.2)", label: "Account Access" },
  general: { color: "#9ca3af", bg: "rgba(107,114,128,0.12)", border: "rgba(107,114,128,0.2)", label: "General" },
};

const INTENT_ORDER = ["billing", "technical", "feature_request", "complaint", "refund", "account_access", "general"];

function TemplateCard({ template }: { template: Template }) {
  const [copied, setCopied] = useState(false);
  const config = INTENT_CONFIG[template.intent] || INTENT_CONFIG.general;

  const copy = () => {
    navigator.clipboard.writeText(template.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ background: "#16161f", border: "1px solid #1e1e2e", borderRadius: "12px", padding: "16px", transition: "all 0.2s" }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = config.border}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "#1e1e2e"}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "8px" }}>
        <p style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>{template.title}</p>
        <button onClick={copy}
          style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: 500, cursor: "pointer", flexShrink: 0,
            background: copied ? "rgba(74,222,128,0.15)" : "rgba(99,102,241,0.12)",
            color: copied ? "#4ade80" : "#818cf8",
            border: copied ? "1px solid rgba(74,222,128,0.25)" : "1px solid rgba(99,102,241,0.2)" }}>
          {copied ? <><CheckCircle style={{ height: "11px", width: "11px" }} />Copied</> : <><Copy style={{ height: "11px", width: "11px" }} />Copy</>}
        </button>
      </div>
      <p style={{ fontSize: "12px", lineHeight: 1.6, color: "#6b7280" }}>{template.body}</p>
      <p style={{ fontSize: "11px", color: "#374151", marginTop: "10px" }}>{template.body.length} chars</p>
    </div>
  );
}

function IntentGroup({ intent, templates, defaultOpen }: { intent: string; templates: Template[]; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const config = INTENT_CONFIG[intent] || INTENT_CONFIG.general;

  return (
    <div style={{ borderRadius: "16px", overflow: "hidden", border: "1px solid #1e1e2e" }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "#16161f", border: "none", cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ height: "10px", width: "10px", borderRadius: "999px", background: config.color }} />
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>{config.label}</span>
          <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "999px", fontWeight: 500, background: config.bg, color: config.color, border: `1px solid ${config.border}` }}>
            {templates.length}
          </span>
        </div>
        {open ? <ChevronUp style={{ height: "16px", width: "16px", color: "#4b5563" }} /> : <ChevronDown style={{ height: "16px", width: "16px", color: "#4b5563" }} />}
      </button>
      {open && (
        <div style={{ padding: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "#0f0f17", borderTop: "1px solid #1e1e2e" }}>
          {templates.map(t => <TemplateCard key={t.id} template={t} />)}
        </div>
      )}
    </div>
  );
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/templates").then(res => { setTemplates(res.data); setLoading(false); });
  }, []);

  const filtered = templates.filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || t.body.toLowerCase().includes(search.toLowerCase()));
  const grouped = INTENT_ORDER.reduce((acc, intent) => {
    const group = filtered.filter(t => t.intent === intent);
    if (group.length > 0) acc[intent] = group;
    return acc;
  }, {} as Record<string, Template[]>);

  return (
    <div style={{ padding: "32px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#fff" }}>Response Templates</h1>
        <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>
          {templates.length} templates across {Object.keys(INTENT_CONFIG).length} categories
        </p>
      </div>

      <div style={{ position: "relative", marginBottom: "20px" }}>
        <Search style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", height: "16px", width: "16px", color: "#4b5563" }} />
        <input placeholder="Search templates by title or content..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: "100%", paddingLeft: "42px", paddingRight: "16px", paddingTop: "12px", paddingBottom: "12px", borderRadius: "12px", fontSize: "13px", color: "#fff", background: "#16161f", border: "1px solid #1e1e2e", outline: "none", boxSizing: "border-box" }}
          onFocus={e => { e.currentTarget.style.border = "1px solid rgba(99,102,241,0.4)"; }}
          onBlur={e => { e.currentTarget.style.border = "1px solid #1e1e2e"; }}
        />
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ borderRadius: "16px", overflow: "hidden", border: "1px solid #1e1e2e" }}>
              <div style={{ padding: "16px 20px", background: "#16161f" }}>
                <div className="skeleton" style={{ height: "16px", width: "160px", borderRadius: "6px" }} />
              </div>
            </div>
          ))}
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div style={{ textAlign: "center", padding: "96px 0" }}>
          <p style={{ fontSize: "16px", fontWeight: 600, color: "#fff" }}>No templates found</p>
          <p style={{ fontSize: "13px", color: "#4b5563", marginTop: "4px" }}>Try a different search term</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {Object.entries(grouped).map(([intent, templates], i) => (
            <IntentGroup key={intent} intent={intent} templates={templates} defaultOpen={i === 0} />
          ))}
        </div>
      )}
    </div>
  );
}