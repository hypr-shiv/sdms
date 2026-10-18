"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Dashboard/Header";
import AICopilot from "@/components/AICopilot";
import type { Role } from "@/lib/mockData";
import "./dashboard.css";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  userId: string;
  role: Role;
  isEmailVerified?: boolean;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ─── Auth Guard: Check token on mount ───
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const userData = localStorage.getItem("user");

        if (!token || !userData) {
          router.replace("/login");
          return;
        }

        const parsed = JSON.parse(userData) as AuthUser;

        // Basic validation
        if (!parsed.id || !parsed.role || !parsed.name) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
          router.replace("/login");
          return;
        }

        setUser(parsed);

        // Fetch fresh profile state to sync email verification
        try {
          const res = await fetch("http://localhost:3001/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const fresh = await res.json();
            if (typeof fresh.isEmailVerified === "boolean") {
              const updated = { ...parsed, isEmailVerified: fresh.isEmailVerified };
              setUser(updated);
              localStorage.setItem("user", JSON.stringify(updated));
            }
          }
        } catch {
          // Keep cached state
        }
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        router.replace("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // ─── Token Refresh Timer ───
  useEffect(() => {
    if (!user) return;

    const refreshInterval = setInterval(async () => {
      try {
        const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
        if (!token) return;
        const res = await fetch("http://localhost:3001/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          // Token expired or invalid
          localStorage.removeItem("accessToken");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.replace("/login?loggedOut=true");
        }
      } catch {
        // Network error — maintain session
      }
    }, 15 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [user, router]);

  // ─── Loading State ───
  if (isLoading || !user) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-primary)",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: "3px solid rgba(0, 0, 0, 0.1)",
            borderTopColor: "var(--accent-primary)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          Loading dashboard...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Header user={user} />
      <AnimatePresence mode="wait">
        <motion.main 
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="dashboard-main"
        >
          {children}
        </motion.main>
      </AnimatePresence>
      <AICopilot />
    </div>
  );
}
