"use client";
import { useEffect, useState } from "react";
import { Ticket } from "@/lib/types";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { Plus, Search, AlertTriangle, LayoutList, Columns } from "lucide-react";

const URGENCY_COLORS: Record<string, { bg: string; text: string }> = {
  high:   { bg: "rgba(239,68,68,0.12)",  text: "#f87171" },
  medium: { bg: "rgba(245,158,11,0.12)", text: "#fbbf24" },
  low:    { bg: "rgba(34,197,94,0.12)",  text: "#4ade80" },
};

const INTENT_COLORS: Record<string, { bg: string; text: string }> = {
  billing:         { bg: "rgba(59,130,246,0.12)",  text: "#60a5fa" },
  technical:       { bg: "rgba(139,92,246,0.12)",  text: "#a78bfa" },
  feature_request: { bg: "rgba(99,102,241,0.12)",  text: "#818cf8" },
  complaint:       { bg: "rgba(239,68,68,0.12)",   text: "#f87171" },
  refund:          { bg: "rgba(249,115,22,0.12)",  text: "#fb923c" },
  account_access:  { bg: "rgba(20,184,166,0.12)",  text: "#2dd4bf" },
  general:         { bg: "rgba(107,114,128,0.12)", text: "#9ca3af" },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  open:        { bg: "rgba(59,130,246,0.12)",  text: "#60a5fa" },
  in_progress: { bg: "rgba(245,158,11,0.12)",  text: "#fbbf24" },
  resolved:    { bg: "rgba(34,197,94,0.12)",   text: "#4ade80" },
  closed:      { bg: "rgba(107,114,128,0.12)", text: "#9ca3af" },
};

const URGENCY_LEFT_BORDER: Record<string, string> = {
  high: "#ef4444", medium: "#f59e0b", low: "#22c55e",
};

const KANBAN_COLUMNS = [
  { key: "open", label: "Open", color: "#60a5fa" },
  { key: "in_progress", label: "In Progress", color: "#fbbf24" },
  { key: "resolved", label: "Resolved", color: "#4ade80" },
  { key: "closed", label: "Closed", color: "#9ca3af" },
];

function Badge({ bg, text, children }: { bg: string; text: string; children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: "11px",
      padding: "3px 10px",
      borderRadius: "999px",
      fontWeight: 500,
      background: bg,
      color: text,
      whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

export default function QueuePage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [intentFilter, setIntentFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: "", body: "" });
  const [view, setView] = useState<"list" | "kanban">("list");
  const PAGE_SIZE = 20;

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, page_size: PAGE_SIZE };
      if (statusFilter !== "all") params.status = statusFilter;
      if (urgencyFilter !== "all") params.urgency = urgencyFilter;
      if (intentFilter !== "all") params.intent = intentFilter;
      const res = await api.get("/tickets", { params });
      setTickets(res.data.tickets);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, [page, statusFilter, urgencyFilter, intentFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post("/tickets", { ...newTicket, source: "manual" });
      setNewTicket({ subject: "", body: "" });
      setDialogOpen(false);
      fetchTickets();
    } finally {
      setCreating(false);
    }
  };

  const filtered = tickets.filter(t =>
    t.subject.toLowerCase().includes(search.toLowerCase()) ||
    t.body.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fieldStyle = {
  background: "#1a1a26",
  borderColor: "#2e2e3e",
  color: "#f1f5f9",
};

  return (
    <div style={{ padding: "32px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#fff" }}>Ticket Queue</h1>
          <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>{total} tickets total</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", borderRadius: "10px", padding: "4px", gap: "4px", background: "#16161f", border: "1px solid #1e1e2e" }}>
            <button onClick={() => setView("list")} style={{
              padding: "6px", borderRadius: "8px", border: "none", cursor: "pointer",
              background: view === "list" ? "rgba(99,102,241,0.2)" : "transparent",
              color: view === "list" ? "#818cf8" : "#4b5563",
            }}>
              <LayoutList style={{ height: "16px", width: "16px" }} />
            </button>
            <button onClick={() => setView("kanban")} style={{
              padding: "6px", borderRadius: "8px", border: "none", cursor: "pointer",
              background: view === "kanban" ? "rgba(99,102,241,0.2)" : "transparent",
              color: view === "kanban" ? "#818cf8" : "#4b5563",
            }}>
              <Columns style={{ height: "16px", width: "16px" }} />
            </button>
          </div>
          <button
            onClick={() => setDialogOpen(true)}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "9px 16px", borderRadius: "10px",
              fontSize: "13px", fontWeight: 600, color: "#fff",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              border: "none", cursor: "pointer",
            }}
          >
            <Plus style={{ height: "16px", width: "16px" }} /> New Ticket
          </button>
        </div>
      </div>

      {/* Filters */}
<div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "flex-end" }}>
  <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
    <label style={{ display: "block", fontSize: "11px", color: "#6b7280", marginBottom: "6px" }}>Search</label>
    <Search style={{
      position: "absolute", left: "12px", top: "calc(50% + 10px)",
      transform: "translateY(-50%)", height: "16px", width: "16px",
      color: "#4b5563", pointerEvents: "none",
    }} />
    <Input
      placeholder="Search tickets..."
      value={search}
      onChange={e => setSearch(e.target.value)}
      style={{ ...fieldStyle, paddingLeft: "36px" }}
    />
  </div>
  <div>
    <label style={{ display: "block", fontSize: "11px", color: "#6b7280", marginBottom: "6px" }}>Status</label>
    <Select value={statusFilter} onValueChange={(v: string | null) => { if (v) { setStatusFilter(v); setPage(1); } }}>
      <SelectTrigger style={{ ...fieldStyle, width: "150px" }}><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Status</SelectItem>
        <SelectItem value="open">Open</SelectItem>
        <SelectItem value="in_progress">In Progress</SelectItem>
        <SelectItem value="resolved">Resolved</SelectItem>
        <SelectItem value="closed">Closed</SelectItem>
      </SelectContent>
    </Select>
  </div>
  <div>
    <label style={{ display: "block", fontSize: "11px", color: "#6b7280", marginBottom: "6px" }}>Urgency</label>
    <Select value={statusFilter} onValueChange={(v: string | null) => { if (v) { setStatusFilter(v); setPage(1); } }}>
      <SelectTrigger style={{ ...fieldStyle, width: "150px" }}><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Urgency</SelectItem>
        <SelectItem value="high">High</SelectItem>
        <SelectItem value="medium">Medium</SelectItem>
        <SelectItem value="low">Low</SelectItem>
      </SelectContent>
    </Select>
  </div>
  <div>
    <label style={{ display: "block", fontSize: "11px", color: "#6b7280", marginBottom: "6px" }}>Intent</label>
   <Select value={statusFilter} onValueChange={(v: string | null) => { if (v) { setStatusFilter(v); setPage(1); } }}>
      <SelectTrigger style={{ ...fieldStyle, width: "170px" }}><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Intents</SelectItem>
        <SelectItem value="billing">Billing</SelectItem>
        <SelectItem value="technical">Technical</SelectItem>
        <SelectItem value="feature_request">Feature Request</SelectItem>
        <SelectItem value="complaint">Complaint</SelectItem>
        <SelectItem value="refund">Refund</SelectItem>
        <SelectItem value="account_access">Account Access</SelectItem>
        <SelectItem value="general">General</SelectItem>
      </SelectContent>
    </Select>
  </div>
</div>

      {/* Ticket List */}
      {loading ? (
        <p style={{ fontSize: "13px", color: "#6b7280" }}>Loading tickets...</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <p style={{ fontSize: "16px", fontWeight: 600, color: "#fff" }}>No tickets found</p>
          <p style={{ fontSize: "13px", color: "#4b5563", marginTop: "4px" }}>
            Create a new ticket or adjust your filters
          </p>
        </div>
      ) : view === "list" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map(ticket => {
            const urgencyC = URGENCY_COLORS[ticket.urgency || "low"];
            const intentC = INTENT_COLORS[ticket.intent || "general"];
            const statusC = STATUS_COLORS[ticket.status];
            const leftBorder = URGENCY_LEFT_BORDER[ticket.urgency || "low"];

            return (
              <div
                key={ticket.id}
                onClick={() => router.push(`/dashboard/tickets/${ticket.id}`)}
                style={{
                  background: "#1a1a26",
                  border: "1px solid #262635",
                  borderLeft: `3px solid ${leftBorder}`,
                  borderRadius: "12px",
                  padding: "16px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = "#1a1a2e";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.3)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = "#16161f";
                  (e.currentTarget as HTMLElement).style.borderColor = "#1e1e2e";
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      {ticket.needs_review && (
                        <AlertTriangle style={{ height: "14px", width: "14px", color: "#fbbf24", flexShrink: 0 }} />
                      )}
                      <span style={{ fontWeight: 600, fontSize: "14px", color: "#fff" }}>
                        {ticket.subject}
                      </span>
                    </div>
                    <p style={{
                      fontSize: "12px", color: "#6b7280",
                      overflow: "hidden", textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {ticket.body}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                    {ticket.urgency && <Badge bg={urgencyC.bg} text={urgencyC.text}>{ticket.urgency}</Badge>}
                    {ticket.intent && <Badge bg={intentC.bg} text={intentC.text}>{ticket.intent.replace("_", " ")}</Badge>}
                    <Badge bg={statusC.bg} text={statusC.text}>{ticket.status.replace("_", " ")}</Badge>
                    <span style={{ fontSize: "12px", color: "#4b5563", minWidth: "80px", textAlign: "right" }}>
                      {new Date(ticket.created_at ).toLocaleDateString("en-PK", { timeZone: "Asia/Karachi" })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          {KANBAN_COLUMNS.map(col => {
            const colTickets = filtered.filter(t => t.status === col.key);
            return (
              <div key={col.key} style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: "14px", padding: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", padding: "0 4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ height: "8px", width: "8px", borderRadius: "999px", background: col.color }} />
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#fff" }}>{col.label}</span>
                  </div>
                  <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "999px", fontWeight: 500, background: "rgba(255,255,255,0.06)", color: "#6b7280" }}>
                    {colTickets.length}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {colTickets.length === 0 ? (
                    <div style={{ borderRadius: "10px", padding: "16px", textAlign: "center", border: "1px dashed #1e1e2e" }}>
                      <p style={{ fontSize: "11px", color: "#374151" }}>No tickets</p>
                    </div>
                  ) : (
                    colTickets.map(ticket => {
                      const intentC = INTENT_COLORS[ticket.intent || "general"];
                      const urgencyC = URGENCY_COLORS[ticket.urgency || "low"];
                      return (
                        <div
                          key={ticket.id}
                          onClick={() => router.push(`/dashboard/tickets/${ticket.id}`)}
                          style={{ background: "#16161f", border: "1px solid #1e1e2e", borderRadius: "10px", padding: "12px", cursor: "pointer", transition: "all 0.2s" }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.3)"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "#1e1e2e"}
                        >
                          <p style={{ fontSize: "12px", fontWeight: 500, color: "#fff", marginBottom: "8px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any, overflow: "hidden" }}>
                            {ticket.subject}
                          </p>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                            {ticket.intent && <Badge bg={intentC.bg} text={intentC.text}>{ticket.intent.replace("_", " ")}</Badge>}
                            {ticket.urgency && <Badge bg={urgencyC.bg} text={urgencyC.text}>{ticket.urgency}</Badge>}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && view === "list" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "24px" }}>
          <p style={{ fontSize: "13px", color: "#4b5563" }}>Page {page} of {totalPages}</p>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              style={{
                padding: "8px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: 500,
                background: "#16161f", border: "1px solid #1e1e2e",
                color: page === 1 ? "#374151" : "#9ca3af",
                cursor: page === 1 ? "not-allowed" : "pointer",
              }}
            >
              Previous
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              style={{
                padding: "8px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: 500,
                background: "#16161f", border: "1px solid #1e1e2e",
                color: page === totalPages ? "#374151" : "#9ca3af",
                cursor: page === totalPages ? "not-allowed" : "pointer",
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create ticket modal */}
      {dialogOpen && (
        <div
          onClick={() => setDialogOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            background: "rgba(0,0,0,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: "480px",
              background: "#111118", border: "1px solid #1e1e2e", borderRadius: "16px",
              padding: "24px",
            }}
          >
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#fff", marginBottom: "20px" }}>
              Create Ticket
            </h2>
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "6px", display: "block" }}>Subject</label>
                <input
                  placeholder="Brief description of the issue"
                  value={newTicket.subject}
                  onChange={e => setNewTicket(p => ({ ...p, subject: e.target.value }))}
                  required
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: "10px", fontSize: "13px",
                    color: "#f1f5f9", background: "#16161f", border: "1px solid #2a2a3e",
                    outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "6px", display: "block" }}>Message</label>
                <textarea
                  placeholder="Full ticket details..."
                  rows={5}
                  value={newTicket.body}
                  onChange={e => setNewTicket(p => ({ ...p, body: e.target.value }))}
                  required
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: "10px", fontSize: "13px",
                    color: "#f1f5f9", background: "#16161f", border: "1px solid #2a2a3e",
                    outline: "none", boxSizing: "border-box", resize: "none",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "4px" }}>
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  style={{
                    padding: "9px 16px", borderRadius: "10px", fontSize: "13px",
                    background: "transparent", border: "1px solid #1e1e2e", color: "#6b7280",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    padding: "9px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 600,
                    color: "#fff",
                    background: creating ? "rgba(99,102,241,0.5)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    border: "none",
                    cursor: creating ? "not-allowed" : "pointer",
                  }}
                >
                  {creating ? "Creating..." : "Create & Classify"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}