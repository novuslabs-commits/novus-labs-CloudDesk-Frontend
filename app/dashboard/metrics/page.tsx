"use client";
import { useEffect, useState, useRef } from "react";
import { Metrics, TrendPoint } from "@/lib/types";
import api from "@/lib/api";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, Users, Inbox, AlertTriangle, CheckCircle, MessageSquare, RefreshCw } from "lucide-react";

const INTENT_COLORS: Record<string, string> = {
  billing: "#60a5fa", technical: "#a78bfa", feature_request: "#818cf8",
  complaint: "#f87171", refund: "#fb923c", account_access: "#2dd4bf", general: "#9ca3af",
};

const URGENCY_CONFIG = [
  { key: "high", label: "High", color: "#ef4444" },
  { key: "medium", label: "Medium", color: "#f59e0b" },
  { key: "low", label: "Low", color: "#22c55e" },
];

const SENTIMENT_CONFIG = [
  { key: "positive", label: "Positive", color: "#4ade80" },
  { key: "neutral", label: "Neutral", color: "#9ca3af" },
  { key: "negative", label: "Negative", color: "#f87171" },
];

const cardStyle = { background: "#1a1a26", border: "1px solid #262635", borderRadius: "16px" };

function useCountUp(target: number, duration = 800) {
  const [count, setCount] = useState(0);
  const startTime = useRef<number | null>(null);
  const frameRef = useRef<number>(0);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    startTime.current = null;
    const animate = (t: number) => {
      if (!startTime.current) startTime.current = t;
      const progress = Math.min((t - startTime.current) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);
  return count;
}

function KPICard({ label, value, icon: Icon, color, suffix = "" }: { label: string; value: number; icon: any; color: string; suffix?: string }) {
  const count = useCountUp(value);
  return (
    <div style={{ ...cardStyle, padding: "14px", transition: "all 0.2s" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.3)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#262635"; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ height: "28px", width: "28px", borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", background: `${color}20`, border: `1px solid ${color}30`, flexShrink: 0 }}>
          <Icon style={{ height: "13px", width: "13px", color }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: "18px", fontWeight: 700, color: "#fff", lineHeight: 1.1 }}>{count}{suffix}</p>
          <p style={{ fontSize: "10px", color: "#6b7280", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</p>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ ...cardStyle, padding: "14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div className="skeleton" style={{ height: "28px", width: "28px", borderRadius: "9px" }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: "16px", width: "40px", borderRadius: "6px", marginBottom: "6px" }} />
          <div className="skeleton" style={{ height: "10px", width: "60px", borderRadius: "6px" }} />
        </div>
      </div>
    </div>
  );
}

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetrics = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await api.get("/metrics");
      setMetrics(res.data);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTrend = async () => {
    const res = await api.get("/metrics/trend");
    setTrend(res.data);
  };

  useEffect(() => {
    fetchMetrics();
    fetchTrend();
    const interval = setInterval(() => fetchMetrics(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const intentData = metrics ? Object.entries(metrics.intent_distribution).map(([name, value]) => ({ name, value })) : [];
  const totalTickets = metrics?.total_tickets || 0;

  return (
    <div style={{ padding: "32px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#fff" }}>Metrics</h1>
          <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>Live performance overview</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {lastUpdated && (
            <p style={{ fontSize: "12px", color: "#4b5563" }}>
              Updated {lastUpdated.toLocaleTimeString("en-PK", { timeZone: "Asia/Karachi" })}
            </p>
          )}
          <button onClick={() => fetchMetrics(true)}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", background: "#1a1a26", border: "1px solid #262635", color: "#6b7280", cursor: "pointer" }}>
            <RefreshCw className={refreshing ? "animate-spin" : ""} style={{ height: "14px", width: "14px" }} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards — 4 per row, 2 rows */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
        {loading ? (
          [...Array(8)].map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <KPICard label="Total Tickets" value={metrics?.total_tickets || 0} icon={Inbox} color="#6366f1" />
            <KPICard label="Open Tickets" value={metrics?.open_tickets || 0} icon={MessageSquare} color="#60a5fa" />
            <KPICard label="Resolved" value={metrics?.resolved_tickets || 0} icon={CheckCircle} color="#4ade80" />
            <KPICard label="Needs Review" value={metrics?.needs_review || 0} icon={AlertTriangle} color="#fbbf24" />
            <KPICard label="Feedback Collected" value={metrics?.total_feedback || 0} icon={Users} color="#8b5cf6" />
            <KPICard label="Avg Model Confidence" value={metrics?.avg_confidence || 0} icon={TrendingUp} color="#2dd4bf" suffix="%" />
            <KPICard label="Feedback Accuracy" value={metrics?.feedback_accuracy || 0} icon={CheckCircle} color="#4ade80" suffix="%" />
            <KPICard label="Active Agents" value={metrics?.agent_workload.length || 0} icon={Users} color="#818cf8" />
          </>
        )}
      </div>

      {/* Pie chart + Line chart side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>

        {/* Intent pie chart */}
        <div style={{ ...cardStyle, padding: "20px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 600, color: "#fff", marginBottom: "4px" }}>Intent Distribution</h3>
          <p style={{ fontSize: "10px", color: "#6b7280", marginBottom: "12px" }}>Share of total classified tickets</p>
          {loading ? (
            <div className="skeleton" style={{ height: "200px", borderRadius: "12px" }} />
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={intentData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {intentData.map(entry => (
                      <Cell key={entry.name} fill={INTENT_COLORS[entry.name] || "#6366f1"} stroke="#1a1a26" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: 8, color: "#f1f5f9", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                {intentData.map(entry => {
                  const pct = totalTickets > 0 ? Math.round((entry.value / totalTickets) * 100) : 0;
                  return (
                    <div key={entry.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ height: "7px", width: "7px", borderRadius: "999px", background: INTENT_COLORS[entry.name] || "#6366f1" }} />
                        <span style={{ color: "#9ca3af" }}>{entry.name.replace("_", " ")}</span>
                      </div>
                      <span style={{ color: "#fff", fontWeight: 600 }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 30-day trend */}
        <div style={{ ...cardStyle, padding: "20px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 600, color: "#fff", marginBottom: "4px" }}>Ticket Volume — Last 30 Days</h3>
          <p style={{ fontSize: "10px", color: "#6b7280", marginBottom: "12px" }}>Daily ticket creation trend</p>
          {loading || trend.length === 0 ? (
            <div className="skeleton" style={{ height: "200px", borderRadius: "12px" }} />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trend}>
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={d => new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
                  interval={5}
                />
                <YAxis tick={{ fontSize: 9, fill: "#6b7280" }} axisLine={false} tickLine={false} allowDecimals={false} width={24} />
                <Tooltip
                  contentStyle={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: 8, color: "#f1f5f9", fontSize: 12 }}
                  labelFormatter={d => new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })}
                />
                <Line type="monotone" dataKey="count" stroke="#818cf8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Agent Workload + Urgency/Sentiment side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

        {/* Agent Workload */}
        <div style={{ ...cardStyle, padding: "20px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 600, color: "#fff", marginBottom: "16px" }}>Agent Workload</h3>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div className="skeleton" style={{ height: "28px", width: "28px", borderRadius: "999px" }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: "10px", width: "110px", borderRadius: "6px", marginBottom: "6px" }} />
                    <div className="skeleton" style={{ height: "6px", width: "100%", borderRadius: "6px" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {metrics?.agent_workload.map(agent => {
                const maxTickets = Math.max(...(metrics?.agent_workload.map(a => a.open_tickets) || [1]), 1);
                const pct = (agent.open_tickets / maxTickets) * 100;
                const initials = agent.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
                const teamColors: Record<string, string> = { Engineering: "#a78bfa", Billing: "#60a5fa", Product: "#818cf8", "Customer Success": "#4ade80" };
                const color = teamColors[agent.team] || "#6366f1";
                return (
                  <div key={agent.agent_id} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ height: "28px", width: "28px", borderRadius: "999px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color, background: `${color}25`, border: `1px solid ${color}40`, flexShrink: 0 }}>
                      {initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "5px" }}>
                        <div style={{ overflow: "hidden" }}>
                          <span style={{ fontSize: "12px", fontWeight: 500, color: "#fff" }}>{agent.name}</span>
                          <span style={{ fontSize: "11px", color: "#4b5563", marginLeft: "6px" }}>· {agent.team}</span>
                        </div>
                        <span style={{ fontSize: "11px", fontWeight: 700, color, flexShrink: 0 }}>{agent.open_tickets} open</span>
                      </div>
                      <div style={{ height: "5px", borderRadius: "999px", background: "#24242f", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: "999px", width: `${pct}%`, background: color, transition: "width 0.6s" }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Urgency + Sentiment stacked */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ ...cardStyle, padding: "16px" }}>
            <h3 style={{ fontSize: "12px", fontWeight: 600, color: "#fff", marginBottom: "12px" }}>Urgency</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {URGENCY_CONFIG.map(({ key, label, color }) => {
                const count = metrics?.urgency_distribution?.[key] || 0;
                const pct = totalTickets > 0 ? Math.round((count / totalTickets) * 100) : 0;
                return (
                  <div key={key}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "5px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ height: "7px", width: "7px", borderRadius: "999px", background: color }} />
                        <span style={{ fontSize: "11px", color: "#9ca3af" }}>{label}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#fff" }}>{count}</span>
                        <span style={{ fontSize: "10px", color: "#4b5563" }}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{ height: "5px", borderRadius: "999px", background: "#24242f", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: "999px", width: `${pct}%`, background: color, transition: "width 0.6s" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ ...cardStyle, padding: "16px" }}>
            <h3 style={{ fontSize: "12px", fontWeight: 600, color: "#fff", marginBottom: "12px" }}>Sentiment</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {SENTIMENT_CONFIG.map(({ key, label, color }) => {
                const count = metrics?.sentiment_distribution?.[key] || 0;
                const pct = totalTickets > 0 ? Math.round((count / totalTickets) * 100) : 0;
                return (
                  <div key={key}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "5px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ height: "7px", width: "7px", borderRadius: "999px", background: color }} />
                        <span style={{ fontSize: "11px", color: "#9ca3af" }}>{label}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#fff" }}>{count}</span>
                        <span style={{ fontSize: "10px", color: "#4b5563" }}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{ height: "5px", borderRadius: "999px", background: "#24242f", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: "999px", width: `${pct}%`, background: color, transition: "width 0.6s" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}