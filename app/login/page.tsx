"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import Image from "next/image";
import api from "@/lib/api";
import Footer from "@/components/Footer";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("username", email);
      form.append("password", password);
      const res = await api.post("/auth/login", form);
      login(res.data.access_token, res.data.agent);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === "string") setError(detail);
      else if (Array.isArray(detail)) setError(detail.map((d: any) => d.msg).join(", "));
      else setError("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { value: "91%", label: "Classification Accuracy" },
    { value: "< 2s", label: "Avg Response Time" },
    { value: "7", label: "Intent Categories" },
    { value: "42", label: "Response Templates" },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#0a0a0f", position: "relative" }}>

      {/* Left panel */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", padding: "48px",
        background: "linear-gradient(135deg, #0d0d1a 0%, #111128 100%)",
        position: "relative", overflow: "hidden", minWidth: 0,
      }}>
        {/* Blobs */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          <div className="animate-blob" style={{ position: "absolute", borderRadius: "999px", opacity: 0.2, background: "radial-gradient(circle, #6366f1, transparent)", width: "400px", height: "400px", top: "-100px", left: "-100px" }} />
          <div className="animate-blob" style={{ position: "absolute", borderRadius: "999px", opacity: 0.15, background: "radial-gradient(circle, #8b5cf6, transparent)", width: "300px", height: "300px", bottom: "0", right: "-50px", animationDelay: "3s" }} />
          <div className="animate-blob" style={{ position: "absolute", borderRadius: "999px", opacity: 0.1, background: "radial-gradient(circle, #4f46e5, transparent)", width: "250px", height: "250px", top: "50%", left: "40%", animationDelay: "6s" }} />
        </div>

        {/* Content */}
        <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", height: "100%" }}>

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }} className="animate-fade-up">
            <div style={{ width: 40, height: 40, position: "relative", borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
              <Image src="/logo-icon.png" alt="CloudDesk" fill loading="eager" sizes="40px" style={{ objectFit: "contain" }} />
            </div>
            <div>
              <p style={{ fontSize: "18px", fontWeight: 700, color: "#fff" }}>CloudDesk</p>
              <p style={{ fontSize: "12px", color: "#6b7280" }}>Support Intelligence Platform</p>
            </div>
          </div>

          {/* Hero */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: "420px" }}>
            <div className="animate-fade-up stagger-1" style={{ marginBottom: "16px" }}>
              <span style={{
                fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
                padding: "5px 14px", borderRadius: "999px",
                background: "rgba(99,102,241,0.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.25)",
              }}>
                AI-Powered Support
              </span>
            </div>

            <h1 className="animate-fade-up stagger-2" style={{ fontSize: "38px", fontWeight: 700, color: "#fff", lineHeight: 1.15 }}>
              Resolve tickets faster<br />
              <span style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                with AI intelligence
              </span>
            </h1>

            <p className="animate-fade-up stagger-3" style={{ marginTop: "16px", fontSize: "14px", lineHeight: 1.6, color: "#9ca3af", maxWidth: "360px" }}>
              Automatically classify, route, and respond to support tickets
              using a fine-tuned AI model trained on your domain.
            </p>

            {/* Stats grid */}
            <div className="animate-fade-up stagger-4" style={{ marginTop: "32px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", maxWidth: "360px" }}>
              {stats.map(({ value, label }) => (
                <div key={label} className="glass" style={{ borderRadius: "14px", padding: "16px" }}>
                  <p style={{ fontSize: "22px", fontWeight: 700, color: "#fff" }}>{value}</p>
                  <p style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="animate-fade-up" style={{ fontSize: "11px", color: "#374151" }}>
            Built with DistilBERT · FastAPI · Next.js · Gemini AI
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div style={{
        width: "420px", flexShrink: 0, display: "flex", flexDirection: "column",
        justifyContent: "center", padding: "48px 40px", background: "#111118", borderLeft: "1px solid #1e1e2e",
      }}>
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#ffffff", marginBottom: "6px" }}>Welcome back</h2>
          <p style={{ fontSize: "14px", color: "#6b7280" }}>Sign in to your support dashboard</p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#9ca3af", marginBottom: "6px" }}>
              Email address
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@clouddesk.com" required
              style={{
                width: "100%", padding: "10px 16px", borderRadius: "12px", fontSize: "14px",
                color: "#f1f5f9", background: "#16161f", border: "1px solid #2a2a3e",
                outline: "none", boxSizing: "border-box", transition: "all 0.2s",
              }}
              onFocus={e => { e.currentTarget.style.border = "1px solid rgba(99,102,241,0.6)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)"; }}
              onBlur={e => { e.currentTarget.style.border = "1px solid #2a2a3e"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#9ca3af", marginBottom: "6px" }}>
              Password
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required
              style={{
                width: "100%", padding: "10px 16px", borderRadius: "12px", fontSize: "14px",
                color: "#f1f5f9", background: "#16161f", border: "1px solid #2a2a3e",
                outline: "none", boxSizing: "border-box", transition: "all 0.2s",
              }}
              onFocus={e => { e.currentTarget.style.border = "1px solid rgba(99,102,241,0.6)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)"; }}
              onBlur={e => { e.currentTarget.style.border = "1px solid #2a2a3e"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </div>

          {error && (
            <div style={{
              padding: "12px 16px", borderRadius: "12px", fontSize: "13px", color: "#f87171",
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: "16px",
            }}>
              {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              width: "100%", padding: "11px", borderRadius: "12px", fontSize: "14px", fontWeight: 600,
              color: "#ffffff",
              background: loading ? "rgba(99,102,241,0.5)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              border: "none", cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s", marginBottom: "28px",
            }}
            onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 25px rgba(99,102,241,0.4)"; } }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <span style={{ width: "14px", height: "14px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", animation: "spin 0.6s linear infinite", display: "inline-block" }} />
                Signing in...
              </span>
            ) : "Sign in"}
          </button>
        </form>

        <div>
          <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", color: "#374151", marginBottom: "10px" }}>
            DEMO CREDENTIALS
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              { label: "Admin", email: "admin@clouddesk.com", pass: "Admin1234" },
              { label: "Agent", email: "sara@clouddesk.com", pass: "Agent1234" },
            ].map(({ label, email: e, pass }) => (
              <button
                key={label} type="button" onClick={() => { setEmail(e); setPassword(pass); }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px", borderRadius: "10px", fontSize: "12px", color: "#6b7280",
                  background: "#16161f", border: "1px solid #2a2a3e", cursor: "pointer",
                  transition: "all 0.2s", width: "100%",
                }}
                onMouseEnter={e2 => { (e2.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.4)"; (e2.currentTarget as HTMLElement).style.color = "#a5b4fc"; }}
                onMouseLeave={e2 => { (e2.currentTarget as HTMLElement).style.borderColor = "#2a2a3e"; (e2.currentTarget as HTMLElement).style.color = "#6b7280"; }}
              >
                <span style={{ fontWeight: 600 }}>{label}</span>
                <span>{e}</span>
              </button>
            ))}
          </div>
          <p style={{ fontSize: "11px", textAlign: "center", color: "#374151", marginTop: "8px" }}>
            Click a credential to auto-fill
          </p>
        </div>
        <div style={{ marginTop: "auto", paddingTop: "24px" }}>
  <Footer />
</div>
      </div>
    </div>
  );
}