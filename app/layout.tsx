import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CloudDesk — Support Intelligence",
  description: "AI-powered support ticket management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ colorScheme: "dark" }}>
      <body className={inter.className} style={{ background: "#0a0a0f", color: "#f1f5f9" }}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}