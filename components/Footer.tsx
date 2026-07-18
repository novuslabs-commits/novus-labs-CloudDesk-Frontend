import { Mail, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <div style={{
      marginTop: "48px",
      paddingTop: "20px",
      paddingBottom: "24px",
      borderTop: "1px solid #24242f",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "16px",
    }}>
      <span style={{ fontSize: "11px", color: "#4b5563", letterSpacing: "0.02em" }}>
        Built by <span style={{ color: "#6b7280", fontWeight: 600 }}>Novus Labs</span>
      </span>

      <span style={{ width: "3px", height: "3px", borderRadius: "999px", background: "#374151" }} />

      <a
        href="mailto:novuslabs.team@gmail.com"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          fontSize: "11px",
          color: "#4b5563",
          textDecoration: "none",
          transition: "color 0.2s"
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#818cf8"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#4b5563"}
      >
        <Mail style={{ height: "11px", width: "11px" }} />
        novuslabs.team@gmail.com
      </a>

      <span style={{ width: "3px", height: "3px", borderRadius: "999px", background: "#374151" }} />

      <a
        href="https://www.linkedin.com/company/novus-labs-tech/"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          fontSize: "11px",
          color: "#4b5563",
          textDecoration: "none",
          transition: "color 0.2s"
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#818cf8"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#4b5563"}
      >
        <ExternalLink style={{ height: "11px", width: "11px" }} />
        LinkedIn
      </a>
    </div>
  );
}