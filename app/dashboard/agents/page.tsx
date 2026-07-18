"use client";
import { useEffect, useState } from "react";
import { Agent } from "@/lib/types";
import api from "@/lib/api";
import { Mail, Shield, Briefcase, Ticket } from "lucide-react";

const TEAM_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  Engineering: { color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.25)" },
  Billing: { color: "#60a5fa", bg: "rgba(96,165,250,0.12)", border: "rgba(96,165,250,0.25)" },
  Product: { color: "#818cf8", bg: "rgba(129,140,248,0.12)", border: "rgba(129,140,248,0.25)" },
  "Customer Success": { color: "#4ade80", bg: "rgba(74,222,128,0.12)", border: "rgba(74,222,128,0.25)" },
};

const STATUS_OPTIONS = ["free", "busy"] as const;
type Status = typeof STATUS_OPTIONS[number];
const STATUS_CONFIG: Record<Status, { color: string; label: string }> = {
  free: { color: "#4ade80", label: "Free" },
  busy: { color: "#fbbf24", label: "Busy" },
  
};

function AgentCard({ agent, index }: { agent: Agent; index: number }) {
  const [status, setStatus] = useState<Status>((agent as any).availability || "free");
  const [openTickets, setOpenTickets] = useState(0);
  const [updating, setUpdating] = useState(false);
  
  useEffect(() => {
    api.get("/tickets", { params: { page: 1, page_size: 100 } }).then(res => {
      const count = res.data.tickets.filter((t: any) => t.assigned_agent_id === agent.id && ["open", "in_progress"].includes(t.status)).length;
      setOpenTickets(count);
    }).catch(() => {});
  }, [agent.id]);

  const teamConfig = TEAM_COLORS[agent.team || ""] || TEAM_COLORS["Engineering"];
  const initials = agent.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const statusConf = STATUS_CONFIG[status];

  return (
    <div style={{ background: "#16161f", border: "1px solid #1e1e2e", borderRadius: "16px", padding: "20px", transition: "all 0.2s" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = teamConfig.border; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#1e1e2e"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
        <div style={{ position: "relative" }}>
          <div style={{ height: "48px", width: "48px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 700, background: teamConfig.bg, border: `1px solid ${teamConfig.border}`, color: teamConfig.color }}>
            {initials}
          </div>
          <div style={{ position: "absolute", bottom: "-2px", right: "-2px" }}>
            <span style={{ height: "12px", width: "12px", borderRadius: "999px", display: "block", background: statusConf.color, border: "2px solid #16161f" }} />
          </div>
        </div>
        <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "999px", fontWeight: 500, display: "flex", alignItems: "center", gap: "4px",
          background: agent.role === "admin" ? "rgba(139,92,246,0.15)" : "rgba(99,102,241,0.12)",
          color: agent.role === "admin" ? "#c4b5fd" : "#818cf8",
          border: agent.role === "admin" ? "1px solid rgba(139,92,246,0.25)" : "1px solid rgba(99,102,241,0.2)" }}>
          <Shield style={{ height: "11px", width: "11px" }} />
          {agent.role}
        </span>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <p style={{ fontWeight: 600, color: "#fff", fontSize: "15px" }}>{agent.name}</p>
        <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
          <Mail style={{ height: "12px", width: "12px" }} />
          {agent.email}
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px" }}>
        <Briefcase style={{ height: "14px", width: "14px", color: teamConfig.color }} />
        <span style={{ fontSize: "12px", fontWeight: 500, color: teamConfig.color }}>{agent.team}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: "12px", background: "#111118", border: "1px solid #1e1e2e", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Ticket style={{ height: "14px", width: "14px", color: "#6b7280" }} />
          <span style={{ fontSize: "12px", color: "#6b7280" }}>Open tickets</span>
        </div>
        <span style={{ fontSize: "13px", fontWeight: 700, color: teamConfig.color }}>{openTickets}</span>
      </div>

      <div>
        <p style={{ fontSize: "11px", color: "#4b5563", marginBottom: "8px" }}>Availability</p>
        <div style={{ display: "flex", borderRadius: "10px", padding: "4px", gap: "4px", background: "#111118", border: "1px solid #1e1e2e" }}>
          {STATUS_OPTIONS.map(s => (
          <button
          key={s}
          disabled={updating}
          onClick={async () => {
            setUpdating(true);
            try {
          await api.patch(`/agents/${agent.id}/availability`, { availability: s });
             setStatus(s);
           } finally {
             setUpdating(false);
           }
       }}
              style={{ flex: 1, padding: "6px 0", borderRadius: "8px", fontSize: "11px", fontWeight: 500, cursor: "pointer",
                background: status === s ? `${STATUS_CONFIG[s].color}20` : "transparent",
                color: status === s ? STATUS_CONFIG[s].color : "#4b5563",
                border: status === s ? `1px solid ${STATUS_CONFIG[s].color}30` : "1px solid transparent" }}>
              {STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/agents").then(res => { setAgents(res.data); setLoading(false); });
  }, []);

  return (
    <div style={{ padding: "32px" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#fff" }}>Agents</h1>
        <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>{agents.length} team members</p>
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ background: "#16161f", border: "1px solid #1e1e2e", borderRadius: "16px", padding: "20px" }}>
              <div className="skeleton" style={{ height: "48px", width: "48px", borderRadius: "16px", marginBottom: "16px" }} />
              <div className="skeleton" style={{ height: "14px", width: "128px", borderRadius: "6px", marginBottom: "8px" }} />
              <div className="skeleton" style={{ height: "12px", width: "176px", borderRadius: "6px" }} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {agents.map((agent, i) => <AgentCard key={agent.id} agent={agent} index={i} />)}
        </div>
      )}
    </div>
  );
}