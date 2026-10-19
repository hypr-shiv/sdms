"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell, Settings, Sun, Moon, Check, CheckCheck,
  GraduationCap, CreditCard, AlertTriangle, ArrowRight,
  ExternalLink, X, ShieldCheck, MessageSquare, Mail, ShieldAlert,
  Menu, Home, BookOpen, LogOut, ChevronRight
} from "lucide-react";
import { type Role } from "@/lib/mockData";

interface HeaderProps {
  user: {
    name: string;
    role: Role;
    id?: string;
    email?: string;
    isEmailVerified?: boolean;
  };
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  priority?: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  academic: { icon: <GraduationCap size={15} />, color: "#6366f1", bg: "rgba(99, 102, 241, 0.12)", label: "Academic" },
  financial: { icon: <CreditCard size={15} />, color: "#f59e0b", bg: "rgba(245, 158, 11, 0.12)", label: "Financial" },
  system: { icon: <Settings size={15} />, color: "#3b82f6", bg: "rgba(59, 130, 246, 0.12)", label: "System" },
  alert: { icon: <AlertTriangle size={15} />, color: "#ef4444", bg: "rgba(239, 68, 68, 0.12)", label: "Security Alert" },
};

export default function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);

  // Notification Center States
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [quickNotifs, setQuickNotifs] = useState<NotificationItem[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile drawer or notifications on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
        setIsNotifOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Prevent background scrolling while mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // Read theme preference on mount
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark") {
      setIsDark(true);
      document.documentElement.setAttribute("data-theme", "dark");
    } else if (stored === "light") {
      setIsDark(false);
      document.documentElement.removeAttribute("data-theme");
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setIsDark(true);
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
    }
  };

  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessToken");
    }
    return null;
  };

  // Fetch unread count & recent notifications
  const fetchUnreadCount = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch("http://localhost:3001/notifications/unread-count", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {}
  }, []);

  const fetchQuickNotifs = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    setLoadingNotifs(true);
    try {
      const res = await fetch("http://localhost:3001/notifications?unreadOnly=false", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setQuickNotifs(data.slice(0, 5));
      }
    } catch {
    } finally {
      setLoadingNotifs(false);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000); // Polling every 15s

    // Real-time Server-Sent Events (SSE) connection
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("http://localhost:3001/notifications/stream");
      eventSource.onmessage = () => {
        fetchUnreadCount();
        if (isNotifOpen) fetchQuickNotifs();
      };
    } catch {}

    return () => {
      clearInterval(interval);
      if (eventSource) eventSource.close();
    };
  }, [fetchUnreadCount, fetchQuickNotifs, isNotifOpen]);

  // Click outside to close notification dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    if (isNotifOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isNotifOpen]);

  const handleToggleNotif = () => {
    const nextState = !isNotifOpen;
    setIsNotifOpen(nextState);
    if (nextState) {
      fetchQuickNotifs();
    }
  };

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const token = getAuthToken();
    try {
      await fetch(`http://localhost:3001/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setQuickNotifs((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    const token = getAuthToken();
    try {
      await fetch("http://localhost:3001/notifications/read-all", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setQuickNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  // Format relative time helper
  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Get user initials
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
      if (token) {
        await fetch("http://localhost:3001/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }).catch(() => {});
      }
    } catch {
      // Ignore network errors during logout
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      document.cookie = "accessToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      document.cookie = "refreshToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      router.push("/login?loggedOut=true");
    }
  };

  const navSections = [
    {
      category: "Academics",
      items: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Courses", href: "/dashboard/courses" },
        { label: "Assignments", href: "/dashboard/assignments" },
        { label: "Exams", href: "/dashboard/exams" },
        { label: "Grades", href: "/dashboard/grades" },
        { label: "Attendance", href: "/dashboard/attendance" },
        { label: "Resources", href: "/dashboard/resources" },
        { label: "Calendar", href: "/dashboard/calendar" },
        { label: "Evaluations", href: "/dashboard/evaluations" },
      ],
    },
    {
      category: "AI & Intelligence",
      items: [
        { label: user.role === "student" ? "Academic Wellness" : "At-Risk AI", href: "/dashboard/at-risk" },
        { label: "AI Copilot", href: "/dashboard/copilot" },
        { label: "Reports", href: "/dashboard/reports" },
        { label: "Analytics", href: "/dashboard/analytics" },
      ],
    },
    {
      category: "Campus & Community",
      items: [
        { label: "Messages", href: "/dashboard/messages" },
        { label: "Announcements", href: "/dashboard/announcements" },
        { label: "Gamification", href: "/dashboard/gamification" },
        { label: "Fees & Invoices", href: "/dashboard/fees" },
      ],
    },
    {
      category: "Administration & Security",
      items: [
        { label: "Compliance & FERPA", href: "/dashboard/compliance" },
        { label: "Data Hub", href: "/dashboard/bulk-data" },
        { label: "System Config", href: "/dashboard/system-config" },
      ],
    },
  ];

  const navLinks = navSections.flatMap((sec) => sec.items);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <header className="dashboard-header">
      {user.isEmailVerified === false && !isBannerDismissed && (
        <div
          className="email-verify-banner"
          style={{
            background: "linear-gradient(90deg, rgba(245, 158, 11, 0.18), rgba(217, 119, 6, 0.18))",
            borderBottom: "1px solid rgba(245, 158, 11, 0.35)",
            padding: "8px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.84rem",
            color: "#fef3c7",
            width: "100%",
            boxSizing: "border-box",
            backdropFilter: "blur(12px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 8px",
                borderRadius: 12,
                background: "rgba(245, 158, 11, 0.3)",
                color: "#fbbf24",
                fontWeight: 700,
                fontSize: "0.72rem",
                letterSpacing: "0.03em",
                textTransform: "uppercase",
              }}
            >
              <ShieldAlert size={12} /> Action Required
            </span>
            <span>
              Your institutional email{" "}
              <strong style={{ color: "#fff" }}>{user.email || "address"}</strong> is unverified.
              Verify now to secure grade access and official reports.
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() =>
                router.push(
                  `/verify-email?email=${encodeURIComponent(user.email || "")}`
                )
              }
              style={{
                background: "#f59e0b",
                color: "#0f172a",
                border: "none",
                borderRadius: 8,
                padding: "4px 12px",
                fontSize: "0.8rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <Mail size={13} /> Verify Email
            </button>
            <button
              onClick={() => setIsBannerDismissed(true)}
              title="Dismiss reminder"
              style={{
                background: "transparent",
                border: "none",
                color: "#fde68a",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                padding: 4,
              }}
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      <div className="header-pill">
        <div className="header-left">
          <a href="/dashboard" className="header-brand">
            <div
              style={{
                background: isDark ? "rgba(255,255,255,0.1)" : "#000",
                color: "#fff",
                borderRadius: "20px",
                padding: "4px 12px",
                fontSize: "0.9rem",
                fontWeight: 600,
                transition: "background 0.3s ease",
              }}
            >
              ScholarPulse
            </div>
          </a>
        </div>

        <nav className="header-nav">
          {navLinks.map((link) => (
            <button
              key={link.href}
              className={`nav-link ${isActive(link.href) ? "active" : ""}`}
              onClick={() => router.push(link.href)}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="header-right" ref={dropdownRef} style={{ position: "relative" }}>
          {/* Theme Toggle */}
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Light mode" : "Dark mode"}
          >
            {isDark ? <Sun size={20} strokeWidth={1.5} /> : <Moon size={20} strokeWidth={1.5} />}
          </button>

          {/* Direct Messaging */}
          <button
            className="icon-btn hide-mobile-quick"
            aria-label="Direct Messages"
            title="Direct Messages (Student ↔ Teacher)"
            onClick={() => router.push("/dashboard/messages")}
          >
            <MessageSquare size={20} strokeWidth={1.5} />
          </button>

          {/* Privacy & Compliance (FERPA / GDPR) */}
          <button
            className="icon-btn hide-mobile-quick"
            aria-label="Data Privacy & Compliance"
            title="Data Privacy & Compliance (FERPA / GDPR)"
            onClick={() => router.push("/dashboard/compliance")}
          >
            <ShieldCheck size={20} strokeWidth={1.5} />
          </button>

          {/* Quick Settings */}
          <button
            className="icon-btn hide-mobile-quick"
            aria-label="Notification Settings"
            title="Notification Settings"
            onClick={() => router.push("/dashboard/notifications")}
          >
            <Settings size={20} strokeWidth={1.5} />
          </button>

          {/* Real-time Notification Bell Button */}
          <button
            className="icon-btn"
            aria-label="Notifications"
            onClick={handleToggleNotif}
            style={{ position: "relative" }}
            title="Notifications Center"
          >
            <Bell size={20} strokeWidth={1.5} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  right: 2,
                  minWidth: 18,
                  height: 18,
                  padding: "0 4px",
                  borderRadius: 10,
                  background: "#ef4444",
                  color: "#ffffff",
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 8px rgba(239, 68, 68, 0.6)",
                  animation: "notifPulse 2s infinite",
                }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* Interactive In-App Notification Center Dropdown Panel */}
          {isNotifOpen && (
            <div
              style={{
                position: "absolute",
                top: 48,
                right: 0,
                width: "min(380px, calc(100vw - 32px))",
                background: "var(--bg-primary)",
                border: "1px solid var(--border-primary)",
                borderRadius: 16,
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
                zIndex: 1000,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                animation: "dropdownFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              {/* Dropdown Header */}
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--border-primary)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "var(--bg-secondary)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Bell size={16} color="var(--accent-primary)" />
                  <strong style={{ fontSize: "0.95rem", color: "var(--text-primary)" }}>
                    Notification Center
                  </strong>
                  {unreadCount > 0 && (
                    <span
                      style={{
                        background: "rgba(239, 68, 68, 0.12)",
                        color: "#ef4444",
                        padding: "2px 8px",
                        borderRadius: 12,
                        fontSize: "0.72rem",
                        fontWeight: 700,
                      }}
                    >
                      {unreadCount} unread
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", gap: 6 }}>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--accent-primary)",
                        cursor: "pointer",
                        fontSize: "0.76rem",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                      title="Mark all as read"
                    >
                      <CheckCheck size={14} /> Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setIsNotifOpen(false)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                      padding: 2,
                    }}
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Notification List */}
              <div style={{ maxHeight: 360, overflowY: "auto", display: "flex", flexDirection: "column" }}>
                {loadingNotifs ? (
                  <div style={{ padding: 28, textAlign: "center", color: "var(--text-secondary)", fontSize: "0.84rem" }}>
                    Loading updates...
                  </div>
                ) : quickNotifs.length === 0 ? (
                  <div style={{ padding: 36, textAlign: "center", color: "var(--text-secondary)" }}>
                    <Bell size={32} style={{ opacity: 0.3, margin: "0 auto 8px" }} />
                    <p style={{ margin: 0, fontSize: "0.85rem" }}>You are completely caught up!</p>
                  </div>
                ) : (
                  quickNotifs.map((notif) => {
                    const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system;
                    return (
                      <div
                        key={notif.id}
                        onClick={() => {
                          if (notif.link) {
                            setIsNotifOpen(false);
                            router.push(notif.link);
                          }
                        }}
                        style={{
                          padding: "14px 18px",
                          borderBottom: "1px solid var(--border-primary)",
                          background: notif.read ? "transparent" : "rgba(99, 102, 241, 0.04)",
                          cursor: "pointer",
                          display: "flex",
                          gap: 12,
                          alignItems: "flex-start",
                          transition: "background 0.15s ease",
                        }}
                      >
                        {/* Type Icon Pill */}
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: cfg.bg,
                            color: cfg.color,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            marginTop: 2,
                          }}
                        >
                          {cfg.icon}
                        </div>

                        {/* Text Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                            <div
                              style={{
                                fontSize: "0.85rem",
                                fontWeight: notif.read ? 600 : 700,
                                color: "var(--text-primary)",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {notif.title}
                            </div>
                            <span style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", marginLeft: 8, flexShrink: 0 }}>
                              {getRelativeTime(notif.createdAt)}
                            </span>
                          </div>

                          <div
                            style={{
                              fontSize: "0.78rem",
                              color: "var(--text-secondary)",
                              lineHeight: 1.35,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {notif.message}
                          </div>

                          {/* Quick Deep Link indicator */}
                          {notif.link && (
                            <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 4, fontSize: "0.72rem", color: "var(--accent-primary)", fontWeight: 600 }}>
                              Open link <ExternalLink size={10} />
                            </div>
                          )}
                        </div>

                        {/* Read Toggle Button */}
                        {!notif.read && (
                          <button
                            onClick={(e) => handleMarkAsRead(notif.id, e)}
                            title="Mark as read"
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "var(--text-tertiary)",
                              cursor: "pointer",
                              padding: 4,
                              borderRadius: 4,
                            }}
                          >
                            <Check size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Dropdown Footer */}
              <div
                style={{
                  padding: "10px 16px",
                  background: "var(--bg-secondary)",
                  borderTop: "1px solid var(--border-primary)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <button
                  onClick={() => {
                    setIsNotifOpen(false);
                    router.push("/dashboard/notifications");
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--accent-primary)",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  View Full Notification Center <ArrowRight size={13} />
                </button>

                <button
                  onClick={() => {
                    setIsNotifOpen(false);
                    router.push("/dashboard/notifications?tab=preferences");
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--text-secondary)",
                    fontSize: "0.76rem",
                    cursor: "pointer",
                  }}
                >
                  Preferences
                </button>
              </div>
            </div>
          )}

          {/* User Profile Avatar with Verification Badge */}
          <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
            <button
              className="user-avatar-btn"
              onClick={handleLogout}
              title={`${user.name} (${user.isEmailVerified ? "Verified" : "Email Unverified"}) • Click to sign out`}
            >
              {initials}
            </button>
            <span
              title={user.isEmailVerified ? "Email verified" : "Email unverified"}
              style={{
                position: "absolute",
                bottom: 2,
                right: 2,
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: user.isEmailVerified ? "#10b981" : "#f59e0b",
                border: "2px solid var(--bg-primary, #0a0a0f)",
                pointerEvents: "none",
              }}
            />
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            title={isMobileMenuOpen ? "Close menu" : "Open navigation menu"}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div
          className="mobile-drawer-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Slide-Out Drawer */}
      <aside className={`mobile-drawer ${isMobileMenuOpen ? "open" : ""}`} aria-label="Mobile Navigation Drawer">
        <div className="mobile-drawer-header">
          <div className="mobile-drawer-brand">
            <span className="brand-badge">ScholarPulse</span>
            <span className="brand-sub">Navigation</span>
          </div>
          <button
            className="mobile-drawer-close"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Mini Profile Card inside drawer */}
        <div className="mobile-drawer-user">
          <div className="drawer-user-avatar">{initials}</div>
          <div className="drawer-user-info">
            <div className="drawer-user-name">{user.name}</div>
            <div className="drawer-user-meta">
              <span className="role-pill">{user.role}</span>
              <span className={`verify-pill ${user.isEmailVerified ? "verified" : "unverified"}`}>
                {user.isEmailVerified ? "Verified" : "Unverified"}
              </span>
            </div>
          </div>
        </div>

        {/* Categorized Nav Sections inside drawer */}
        <nav className="mobile-drawer-nav">
          {navSections.map((sec) => (
            <div key={sec.category} className="mobile-drawer-section">
              <div className="mobile-section-title">{sec.category}</div>
              <div className="mobile-section-items">
                {sec.items.map((item) => (
                  <button
                    key={item.href}
                    className={`mobile-nav-link ${isActive(item.href) ? "active" : ""}`}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      router.push(item.href);
                    }}
                  >
                    <span>{item.label}</span>
                    <ChevronRight size={16} className="nav-chevron" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Mobile Drawer Footer with theme and signout */}
        <div className="mobile-drawer-footer">
          <button className="drawer-action-btn" onClick={toggleTheme}>
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
          </button>
          <button className="drawer-action-btn logout" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Bottom Navigation">
        <button
          className={`mobile-bottom-item ${pathname === "/dashboard" ? "active" : ""}`}
          onClick={() => router.push("/dashboard")}
        >
          <Home size={20} />
          <span>Home</span>
        </button>

        <button
          className={`mobile-bottom-item ${pathname.startsWith("/dashboard/courses") ? "active" : ""}`}
          onClick={() => router.push("/dashboard/courses")}
        >
          <BookOpen size={20} />
          <span>Courses</span>
        </button>

        <button
          className={`mobile-bottom-item ${pathname.startsWith("/dashboard/messages") ? "active" : ""}`}
          onClick={() => router.push("/dashboard/messages")}
        >
          <MessageSquare size={20} />
          <span>Messages</span>
        </button>

        <button
          className={`mobile-bottom-item ${pathname.startsWith("/dashboard/notifications") ? "active" : ""}`}
          onClick={() => router.push("/dashboard/notifications")}
          style={{ position: "relative" }}
        >
          <Bell size={20} />
          <span>Alerts</span>
          {unreadCount > 0 && (
            <span className="bottom-nav-badge">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        <button
          className={`mobile-bottom-item ${isMobileMenuOpen ? "active" : ""}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <Menu size={20} />
          <span>Menu</span>
        </button>
      </nav>
      <style jsx global>{`
        @keyframes notifPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.12); }
          100% { transform: scale(1); }
        }
        @keyframes dropdownFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </header>
  );
}
