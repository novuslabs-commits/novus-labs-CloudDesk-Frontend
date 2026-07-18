"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { Agent } from "./types";
import { useRouter } from "next/navigation";

interface AuthContextType {
  agent: Agent | null;
  token: string | null;
  login: (token: string, agent: Agent) => void;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  agent: null, token: null,
  login: () => {}, logout: () => {}, isAdmin: false
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedAgent = localStorage.getItem("agent");
    if (storedToken && storedAgent) {
      setToken(storedToken);
      setAgent(JSON.parse(storedAgent));
    }
  }, []);

  const login = (token: string, agent: Agent) => {
    localStorage.setItem("token", token);
    localStorage.setItem("agent", JSON.stringify(agent));
    setToken(token);
    setAgent(agent);
    router.push("/dashboard");
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("agent");
    setToken(null);
    setAgent(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{
      agent, token, login, logout,
      isAdmin: agent?.role === "admin"
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);