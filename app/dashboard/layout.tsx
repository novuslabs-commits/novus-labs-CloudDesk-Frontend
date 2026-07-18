"use client";
import { useAuth } from "@/lib/auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Inbox, BarChart3, Users, FileText, History, LogOut } from "lucide-react";
import Footer from "@/components/Footer";
const navItems = [
  { href: "/dashboard", label: "Queue", icon: Inbox },
  { href: "/dashboard/history", label: "History", icon: History },
  { href: "/dashboard/metrics", label: "Metrics", icon: BarChart3 },
  { href: "/dashboard/agents", label: "Agents", icon: Users },
  { href: "/dashboard/templates", label: "Templates", icon: FileText },
];

const TEAM_COLORS: Record<string, string> = {
  Engineering: "linear-gradient(135deg, #a78bfa, #6366f1)",
  Billing: "linear-gradient(135deg, #60a5fa, #06b6d4)",
  Product: "linear-gradient(135deg, #818cf8, #8b5cf6)",
  "Customer Success": "linear-gradient(135deg, #4ade80, #14b8a6)",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { agent, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!localStorage.getItem("token")) router.push("/login");
  }, [router]);

  if (!agent) return null;

  const initials = agent.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const gradient = TEAM_COLORS[agent.team || ""] || "linear-gradient(135deg, #818cf8, #6366f1)";

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0a0a0f" }}>

      {/* Sidebar */}
      <aside style={{ width: "240px", flexShrink: 0, display: "flex", flexDirection: "column", background: "#111118", borderRight: "1px solid #1e1e2e" }}>

        {/* Logo */}
        <div style={{ padding: "20px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid #1e1e2e" }}>
          <div style={{ width: 32, height: 32, position: "relative", borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
            <Image src="/logo-icon.png" alt="CloudDesk" fill loading="eager" sizes="32px" style={{ objectFit: "contain" }} />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: "14px", color: "#fff", letterSpacing: "-0.01em" }}>CloudDesk</p>
            <p style={{ fontSize: "11px", color: "#6b7280" }}>Support Intelligence</p>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px", display: "flex", flexDirection: "column", gap: "3px" }}>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} style={{ textDecoration: "none" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "10px 12px", borderRadius: "10px", fontSize: "13px",
                  cursor: "pointer", transition: "all 0.2s",
                  background: active ? "rgba(99,102,241,0.15)" : "transparent",
                  color: active ? "#fff" : "#6b7280",
                  border: active ? "1px solid rgba(99,102,241,0.25)" : "1px solid transparent",
                }}>
                  <Icon style={{ height: "16px", width: "16px", color: active ? "#818cf8" : "#6b7280" }} />
                  <span style={{ fontWeight: 500 }}>{label}</span>
                  {active && <span style={{ marginLeft: "auto", height: "6px", width: "6px", borderRadius: "999px", background: "#818cf8" }} />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Agent info */}
        <div style={{ padding: "16px", borderTop: "1px solid #1e1e2e" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
            <div style={{
              height: "32px", width: "32px", borderRadius: "999px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "11px", fontWeight: 700, color: "#fff",
              background: gradient, flexShrink: 0,
            }}>
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: "13px", fontWeight: 500, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {agent.name}
              </p>
              <p style={{ fontSize: "11px", color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {agent.role} · {agent.team}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: "8px",
              padding: "8px 12px", borderRadius: "8px", fontSize: "12px",
              color: "#6b7280", background: "transparent", border: "none", cursor: "pointer",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.1)";
              (e.currentTarget as HTMLElement).style.color = "#ef4444";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "#6b7280";
            }}
          >
            <LogOut style={{ height: "14px", width: "14px" }} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: "auto", background: "#131320", display: "flex", flexDirection: "column" }}>
  <div style={{ flex: 1 }}>{children}</div>
  <div style={{ padding: "0 32px" }}>
    <Footer />
  </div>
</main>
    </div>
  );
}