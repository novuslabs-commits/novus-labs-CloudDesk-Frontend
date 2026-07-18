"use client";
import { useEffect, useState } from "react";
import { Ticket } from "@/lib/types";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { Clock, User, CheckCircle } from "lucide-react";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  in_progress: { bg: "rgba(245,158,11,0.12)", text: "#fbbf24" },
  resolved: { bg: "rgba(34,197,94,0.12)", text: "#4ade80" },
  closed: { bg: "rgba(107,114,128,0.12)", text: "#9ca3af" },
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

const fieldStyle = { background: "#16161f", border: "1px solid #2a2a3e", color: "#f1f5f9" };

function Badge({ bg, text, children }: { bg: string; text: string; children: React.ReactNode }) {
  return (
    <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "999px", fontWeight: 500, background: bg, color: text, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

function formatDuration(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function HistoryPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, page_size: PAGE_SIZE };
      if (statusFilter !== "all") params.status = statusFilter;
      const res = await api.get("/tickets/history/list", { params });
      setTickets(res.data.tickets);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, [page, statusFilter]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div style={{ padding: "32px" }}>

      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#fff" }}>History</h1>
        <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>{total} tickets processed</p>
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        {[
          { key: "all", label: "All" },
          { key: "in_progress", label: "In Progress" },
          { key: "resolved", label: "Resolved" },
          { key: "closed", label: "Closed" },
        ].map(f => (
          <button key={f.key} onClick={() => { setStatusFilter(f.key); setPage(1); }}
            style={{
              padding: "7px 16px", borderRadius: "10px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
              background: statusFilter === f.key ? "rgba(99,102,241,0.15)" : "#16161f",
              color: statusFilter === f.key ? "#818cf8" : "#6b7280",
              border: statusFilter === f.key ? "1px solid rgba(99,102,241,0.25)" : "1px solid #1e1e2e",
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <p style={{ fontSize: "13px", color: "#6b7280" }}>Loading history...</p>
      ) : tickets.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <p style={{ fontSize: "16px", fontWeight: 600, color: "#fff" }}>No history yet</p>
          <p style={{ fontSize: "13px", color: "#4b5563", marginTop: "4px" }}>
            Processed tickets will appear here
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {tickets.map(ticket => {
            const statusC = STATUS_COLORS[ticket.status] || STATUS_COLORS.closed;
            const intentC = INTENT_COLORS[ticket.intent || "general"];
            const duration = ticket.initial_response_sent_at && ticket.resolution_sent_at
              ? formatDuration(ticket.initial_response_sent_at, ticket.resolution_sent_at)
              : null;

            return (
              <div
                key={ticket.id}
                onClick={() => router.push(`/dashboard/tickets/${ticket.id}`)}
                style={{ background: "#16161f", border: "1px solid #1e1e2e", borderRadius: "12px", padding: "16px", cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#1a1a2e"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.3)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#16161f"; (e.currentTarget as HTMLElement).style.borderColor = "#1e1e2e"; }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "10px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 600, fontSize: "14px", color: "#fff" }}>{ticket.subject}</span>
                    <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ticket.body}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                    {ticket.intent && <Badge bg={intentC.bg} text={intentC.text}>{ticket.intent.replace("_", " ")}</Badge>}
                    <Badge bg={statusC.bg} text={statusC.text}>{ticket.status.replace("_", " ")}</Badge>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "16px", paddingTop: "10px", borderTop: "1px solid #1e1e2e" }}>
                  {ticket.assigned_team && (
                    <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#6b7280" }}>
                      <User style={{ height: "11px", width: "11px" }} />
                      {ticket.assigned_team}
                    </span>
                  )}
                  {ticket.initial_response_sent_at && (
                    <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#6b7280" }}>
                      <Clock style={{ height: "11px", width: "11px" }} />
                      Responded {new Date(ticket.initial_response_sent_at).toLocaleDateString("en-PK", { timeZone: "Asia/Karachi" })}
                    </span>
                  )}
                  {ticket.resolved_at && (
                    <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#4ade80" }}>
                      <CheckCircle style={{ height: "11px", width: "11px" }} />
                      Resolved {new Date(ticket.resolved_at ).toLocaleDateString("en-PK", { timeZone: "Asia/Karachi" })}
                    </span>
                  )}
                  {duration && (
                    <span style={{ fontSize: "11px", color: "#4b5563", marginLeft: "auto" }}>
                      Resolution time: {duration}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "24px" }}>
          <p style={{ fontSize: "13px", color: "#4b5563" }}>Page {page} of {totalPages}</p>
          <div style={{ display: "flex", gap: "8px" }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              style={{ padding: "8px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, background: "#16161f", border: "1px solid #1e1e2e", color: page === 1 ? "#374151" : "#9ca3af", cursor: page === 1 ? "not-allowed" : "pointer" }}>
              Previous
            </button>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
              style={{ padding: "8px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, background: "#16161f", border: "1px solid #1e1e2e", color: page === totalPages ? "#374151" : "#9ca3af", cursor: page === totalPages ? "not-allowed" : "pointer" }}>
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}