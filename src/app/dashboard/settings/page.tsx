"use client";

import { useState, useEffect } from "react";
import { type Role } from "@/lib/mockData";
import {
  User, Mail, Lock, Bell, Moon, Sun, Palette, Shield,
  Save, Camera, Eye, EyeOff
} from "lucide-react";
import "../dashboard.css";

export default function SettingsPage() {
  const [user, setUser] = useState<{
    role: Role; name: string; email: string; userId: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "notifications" | "appearance">("profile");
  const [darkMode, setDarkMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({
    academic: true,
    financial: true,
    system: true,
    alert: true,
    email: false,
    push: false,
  });

  useEffect(() => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) setUser(JSON.parse(userData));
    } catch {}
  }, []);

  if (!user) return null;

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: <User size={16} /> },
    { id: "security" as const, label: "Security", icon: <Lock size={16} /> },
    { id: "notifications" as const, label: "Notifications", icon: <Bell size={16} /> },
    { id: "appearance" as const, label: "Appearance", icon: <Palette size={16} /> },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="page-hero" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 8 }}>Settings</h1>
          <p style={{ color: "var(--text-secondary)" }}>Manage your account and preferences</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 24 }}>
        {/* Sidebar */}
        <div className="card" style={{ padding: "12px", height: "fit-content" }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "10px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                background: activeTab === tab.id ? "var(--bg-secondary)" : "transparent",
                color: activeTab === tab.id ? "var(--text-primary)" : "var(--text-secondary)",
                fontWeight: activeTab === tab.id ? 600 : 400, fontSize: "0.85rem",
                transition: "all 0.2s", textAlign: "left",
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="card" style={{ padding: "28px 32px" }}>
          {activeTab === "profile" && (
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 24, color: "var(--text-primary)" }}>
                Profile Information
              </h2>

              {/* Avatar */}
              <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: 18,
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: "1.5rem", fontWeight: 700, position: "relative",
                }}>
                  {user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  <button style={{
                    position: "absolute", bottom: -4, right: -4,
                    width: 28, height: 28, borderRadius: "50%",
                    background: "var(--text-primary)", color: "#fff", border: "3px solid var(--bg-primary)",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Camera size={12} />
                  </button>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "1rem", color: "var(--text-primary)" }}>{user.name}</div>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{user.userId}</div>
                  <span style={{
                    fontSize: "0.72rem", padding: "2px 10px", borderRadius: 4,
                    background: "#6366f115", color: "#6366f1", fontWeight: 500,
                    textTransform: "capitalize", marginTop: 4, display: "inline-block",
                  }}>
                    {user.role}
                  </span>
                </div>
              </div>

              {/* Form Fields */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                {[
                  { label: "First Name", value: user.name.split(" ")[0], icon: <User size={14} /> },
                  { label: "Last Name", value: user.name.split(" ").slice(1).join(" "), icon: <User size={14} /> },
                  { label: "Email", value: user.email, icon: <Mail size={14} /> },
                  { label: "Student ID", value: user.userId, icon: <Shield size={14} />, disabled: true },
                ].map((field, i) => (
                  <div key={i}>
                    <label style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>
                      {field.label}
                    </label>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border-primary)",
                      background: field.disabled ? "var(--bg-secondary)" : "var(--bg-primary)",
                    }}>
                      <span style={{ color: "var(--text-tertiary)" }}>{field.icon}</span>
                      <input
                        defaultValue={field.value}
                        disabled={field.disabled}
                        style={{
                          border: "none", background: "transparent", outline: "none",
                          fontSize: "0.85rem", color: "var(--text-primary)", width: "100%",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button style={{
                background: "var(--accent-primary)", color: "#fff", border: "none",
                padding: "10px 24px", borderRadius: 8, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", fontWeight: 500,
              }}>
                <Save size={16} /> Save Changes
              </button>
            </div>
          )}

          {activeTab === "security" && (
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 24, color: "var(--text-primary)" }}>
                Security Settings
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 400 }}>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>
                    Current Password
                  </label>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border-primary)",
                  }}>
                    <Lock size={14} style={{ color: "var(--text-tertiary)" }} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter current password"
                      style={{
                        border: "none", background: "transparent", outline: "none",
                        fontSize: "0.85rem", color: "var(--text-primary)", width: "100%",
                      }}
                    />
                    <button onClick={() => setShowPassword(!showPassword)} style={{
                      background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)",
                    }}>
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>
                    New Password
                  </label>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border-primary)",
                  }}>
                    <Lock size={14} style={{ color: "var(--text-tertiary)" }} />
                    <input
                      type="password"
                      placeholder="Enter new password"
                      style={{
                        border: "none", background: "transparent", outline: "none",
                        fontSize: "0.85rem", color: "var(--text-primary)", width: "100%",
                      }}
                    />
                  </div>
                </div>

                <button style={{
                  background: "var(--accent-primary)", color: "#fff", border: "none",
                  padding: "10px 24px", borderRadius: 8, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", fontWeight: 500, marginTop: 8,
                }}>
                  <Lock size={16} /> Update Password
                </button>

                <div style={{
                  marginTop: 16, padding: "16px", borderRadius: 10,
                  background: "var(--bg-secondary)", border: "1px solid var(--border-primary)",
                }}>
                  <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: 8, color: "var(--text-primary)" }}>
                    Two-Factor Authentication
                  </h3>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: 12 }}>
                    Add an extra layer of security to your account with TOTP-based MFA.
                  </p>
                  <button style={{
                    padding: "8px 18px", borderRadius: 8, border: "1px solid var(--border-primary)",
                    background: "transparent", cursor: "pointer", fontSize: "0.82rem",
                    color: "var(--text-primary)", fontWeight: 500,
                  }}>
                    Enable MFA
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 24, color: "var(--text-primary)" }}>
                Notification Preferences
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { key: "academic", label: "Academic", desc: "Grade posts, assignment updates, attendance alerts" },
                  { key: "financial", label: "Financial", desc: "Fee reminders, payment confirmations, invoices" },
                  { key: "system", label: "System", desc: "Maintenance notices, platform updates" },
                  { key: "alert", label: "Alerts", desc: "At-risk warnings, urgent notifications" },
                  { key: "email", label: "Email Notifications", desc: "Receive notifications via email" },
                  { key: "push", label: "Push Notifications", desc: "Browser push notifications (PWA)" },
                ].map(pref => (
                  <div key={pref.key} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "14px 16px", borderRadius: 10, border: "1px solid var(--border-primary)",
                  }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: "0.88rem", color: "var(--text-primary)" }}>{pref.label}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{pref.desc}</div>
                    </div>
                    <button
                      onClick={() => setNotifPrefs(prev => ({ ...prev, [pref.key]: !prev[pref.key as keyof typeof prev] }))}
                      style={{
                        width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                        background: notifPrefs[pref.key as keyof typeof notifPrefs] ? "var(--accent-primary)" : "var(--bg-secondary)",
                        position: "relative", transition: "background 0.2s",
                      }}
                    >
                      <div style={{
                        width: 18, height: 18, borderRadius: "50%", background: "#fff",
                        position: "absolute", top: 3,
                        left: notifPrefs[pref.key as keyof typeof notifPrefs] ? 23 : 3,
                        transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 24, color: "var(--text-primary)" }}>
                Appearance
              </h2>

              <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
                {[
                  { mode: "light", icon: <Sun size={24} />, label: "Light" },
                  { mode: "dark", icon: <Moon size={24} />, label: "Dark" },
                ].map(opt => (
                  <button
                    key={opt.mode}
                    onClick={() => setDarkMode(opt.mode === "dark")}
                    style={{
                      width: 140, height: 100, borderRadius: 14, cursor: "pointer",
                      border: `2px solid ${(darkMode ? "dark" : "light") === opt.mode ? "var(--accent-primary)" : "var(--border-primary)"}`,
                      background: opt.mode === "dark" ? "#1a1a2e" : "#f8f9fa",
                      display: "flex", flexDirection: "column", alignItems: "center",
                      justifyContent: "center", gap: 8, transition: "all 0.2s",
                      color: opt.mode === "dark" ? "#e2e8f0" : "#374151",
                    }}
                  >
                    {opt.icon}
                    <span style={{ fontSize: "0.82rem", fontWeight: 500 }}>{opt.label}</span>
                  </button>
                ))}
              </div>

              <div style={{
                padding: "16px", borderRadius: 10, background: "var(--bg-secondary)",
                border: "1px solid var(--border-primary)", fontSize: "0.82rem",
                color: "var(--text-secondary)",
              }}>
                <strong>Note:</strong> Dark mode support is a PRD feature (FR-CORE-02). Full implementation requires CSS variable theming integration.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
