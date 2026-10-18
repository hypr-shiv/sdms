"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { type Role } from "@/lib/mockData";
import {
  Bell, Check, CheckCheck, Trash2, Filter, GraduationCap,
  CreditCard, AlertTriangle, Settings, X, Send, Mail,
  Smartphone, Globe, Shield, RefreshCw, Eye, Sparkles,
  Sliders, Clock, Moon, Search, ExternalLink, Play, Layers,
  ChevronRight, Laptop, Lock, AlertCircle, Inbox
} from "lucide-react";
import "../dashboard.css";
import EmptyState from "@/components/UI/EmptyState";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "academic" | "financial" | "system" | "alert";
  priority?: "low" | "normal" | "high" | "urgent";
  read: boolean;
  link?: string;
  metadata?: string;
  channelsDelivered?: string;
  createdAt: string;
}

interface UserPreferences {
  academicInApp: boolean;
  academicEmail: boolean;
  academicPush: boolean;
  financialInApp: boolean;
  financialEmail: boolean;
  financialPush: boolean;
  systemInApp: boolean;
  systemEmail: boolean;
  systemPush: boolean;
  alertInApp: boolean;
  alertEmail: boolean;
  alertPush: boolean;
  frequency: "instant" | "daily_digest" | "weekly";
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  email?: string;
}

interface EmailLogItem {
  id: string;
  to: string;
  subject: string;
  template: string;
  htmlContent: string;
  provider: string;
  sentAt: string;
  status: string;
}

const TYPE_CONFIG = {
  academic: { icon: <GraduationCap size={18} />, color: "#6366f1", bg: "rgba(99, 102, 241, 0.12)", label: "Academic" },
  financial: { icon: <CreditCard size={18} />, color: "#f59e0b", bg: "rgba(245, 158, 11, 0.12)", label: "Financial" },
  system: { icon: <Settings size={18} />, color: "#3b82f6", bg: "rgba(59, 130, 246, 0.12)", label: "System" },
  alert: { icon: <AlertTriangle size={18} />, color: "#ef4444", bg: "rgba(239, 68, 68, 0.12)", label: "Alert" },
};

const PRIORITY_BADGES = {
  urgent: { color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)", label: "Urgent" },
  high: { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)", label: "High" },
  normal: { color: "#6366f1", bg: "rgba(99, 102, 241, 0.15)", label: "Normal" },
  low: { color: "#64748b", bg: "rgba(100, 116, 139, 0.15)", label: "Low" },
};

export default function NotificationsPage() {
  const [user, setUser] = useState<{ role: Role; name: string; email?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"in_app" | "preferences" | "email_outbox" | "push_manager" | "dispatch_console">("in_app");

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Preferences State
  const [preferences, setPreferences] = useState<UserPreferences>({
    academicInApp: true,
    academicEmail: true,
    academicPush: true,
    financialInApp: true,
    financialEmail: true,
    financialPush: true,
    systemInApp: true,
    systemEmail: false,
    systemPush: false,
    alertInApp: true,
    alertEmail: true,
    alertPush: true,
    frequency: "instant",
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "07:00",
  });
  const [prefSaving, setPrefSaving] = useState(false);
  const [prefSavedMsg, setPrefSavedMsg] = useState("");

  // Email Previews State
  const [emailLogs, setEmailLogs] = useState<EmailLogItem[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailLogItem | null>(null);

  // Push Subscriptions State
  const [pushPermission, setPushPermission] = useState<string>("default");
  const [vapidPublicKey, setVapidPublicKey] = useState<string>("");
  const [pushStatusMsg, setPushStatusMsg] = useState<string>("");

  // Dispatch Console State
  const [dispatchType, setDispatchType] = useState<"academic" | "financial" | "system" | "alert">("academic");
  const [dispatchPriority, setDispatchPriority] = useState<"low" | "normal" | "high" | "urgent">("normal");
  const [dispatchTitle, setDispatchTitle] = useState("");
  const [dispatchMessage, setDispatchMessage] = useState("");
  const [dispatchLink, setDispatchLink] = useState("/dashboard/exams");
  const [dispatchEmailTemplate, setDispatchEmailTemplate] = useState<"grade_posted" | "fee_due" | "risk_alert" | "exam_scheduled" | "system_alert">("grade_posted");
  const [channelInApp, setChannelInApp] = useState(true);
  const [channelEmail, setChannelEmail] = useState(true);
  const [channelPush, setChannelPush] = useState(true);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState("");

  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessToken");
    }
    return null;
  };

  // Fetch Notifications from API
  const fetchNotifications = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch("http://localhost:3001/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Preferences
  const fetchPreferences = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch("http://localhost:3001/notifications/preferences", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPreferences(data);
      }
    } catch (err) {
      console.error("Failed to load preferences:", err);
    }
  }, []);

  // Fetch Email Logs
  const fetchEmailLogs = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch("http://localhost:3001/notifications/email-previews", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEmailLogs(data);
      }
    } catch {}
  }, []);

  // Fetch VAPID key
  const fetchVapidKey = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:3001/notifications/vapid-key");
      if (res.ok) {
        const data = await res.json();
        setVapidPublicKey(data.publicKey);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) setUser(JSON.parse(userData));
    } catch {}

    fetchNotifications();
    fetchPreferences();
    fetchEmailLogs();
    fetchVapidKey();

    if (typeof window !== "undefined" && "Notification" in window) {
      setPushPermission(Notification.permission);
    }
  }, [fetchNotifications, fetchPreferences, fetchEmailLogs, fetchVapidKey]);

  // Live SSE listener
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("http://localhost:3001/notifications/stream");
      eventSource.onmessage = () => {
        fetchNotifications();
        fetchEmailLogs();
      };
    } catch {}

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [fetchNotifications, fetchEmailLogs]);

  // Check URL params for active tab (e.g. ?tab=preferences)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get("tab");
      if (tabParam && ["in_app", "preferences", "email_outbox", "push_manager", "dispatch_console"].includes(tabParam)) {
        setActiveTab(tabParam as any);
      }
    }
  }, []);

  // Mark single as read
  const handleMarkAsRead = async (id: string) => {
    const token = getAuthToken();
    try {
      await fetch(`http://localhost:3001/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch {}
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    const token = getAuthToken();
    try {
      await fetch("http://localhost:3001/notifications/read-all", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {}
  };

  // Delete notification
  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const token = getAuthToken();
    try {
      await fetch(`http://localhost:3001/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch {}
  };

  // Clear all
  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear all notification history?")) return;
    const token = getAuthToken();
    try {
      await fetch("http://localhost:3001/notifications/clear-all", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications([]);
    } catch {}
  };

  // Save Preferences
  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setPrefSaving(true);
    setPrefSavedMsg("");
    const token = getAuthToken();
    try {
      const res = await fetch("http://localhost:3001/notifications/preferences", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences),
      });
      if (res.ok) {
        setPrefSavedMsg("Notification channel settings saved successfully!");
        setTimeout(() => setPrefSavedMsg(""), 4000);
      }
    } catch {
    } finally {
      setPrefSaving(false);
    }
  };

  // Request Web Push Permission & Subscribe
  const handleEnableWebPush = async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      alert("Web Push Notifications are not supported on this browser.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);

      if (permission === "granted") {
        const registration = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;

        const token = getAuthToken();
        const fakeSub = {
          endpoint: `https://fcm.googleapis.com/fcm/send/sdms-sub-${Math.random().toString(36).substring(2, 10)}`,
          keys: {
            p256dh: "BMf0vXkH-9j3l9k2l1m4",
            auth: "A1k9z8x7c6v5",
          },
        };

        await fetch("http://localhost:3001/notifications/push-subscription", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(fakeSub),
        });

        setPushStatusMsg("Web Push PWA notification subscription registered successfully!");
      }
    } catch (err: any) {
      setPushStatusMsg(`Push registration notice: ${err.message}`);
    }
  };

  // Dispatch Test Notification (Event-Driven Queue)
  const handleDispatchNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDispatching(true);
    setDispatchSuccessMsg("");
    const token = getAuthToken();

    const channels: Array<"in_app" | "email" | "push"> = [];
    if (channelInApp) channels.push("in_app");
    if (channelEmail) channels.push("email");
    if (channelPush) channels.push("push");

    try {
      const res = await fetch("http://localhost:3001/notifications/dispatch", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: dispatchTitle || "Academic Advisory Notice",
          message: dispatchMessage || "Official notification dispatched through BullMQ/Redis event queue.",
          type: dispatchType,
          priority: dispatchPriority,
          link: dispatchLink,
          channels,
          emailTemplate: dispatchEmailTemplate,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDispatchSuccessMsg(`Notification enqueued into [${data.queueEngine}] with Job ID: ${data.jobId}`);
        fetchNotifications();
        fetchEmailLogs();
        setDispatchTitle("");
        setDispatchMessage("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDispatching(false);
    }
  };

  // Filtered Notifications list
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeFilter !== "all" && n.type !== activeFilter) return false;
      if (unreadOnly && n.read) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q);
      }
      return true;
    });
  }, [notifications, activeFilter, unreadOnly, searchQuery]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const diffMs = Date.now() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 48 }}>
      {/* ── Top Hero Banner ── */}
      <div className="page-hero" style={{ marginBottom: 0, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{
              background: "rgba(99, 102, 241, 0.15)",
              color: "#6366f1",
              padding: "4px 12px",
              borderRadius: 20,
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}>
              FR-COMM-01
            </span>
            <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              Multi-Channel Notification Engine
            </span>
          </div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>
            Notification Center & Communication Hub
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: 0 }}>
            Real-time in-app alerts, transactional email dispatch (SendGrid / AWS SES), Web Push PWA, and per-user notification preferences.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              style={{
                background: "var(--accent-primary)",
                color: "#ffffff",
                border: "none",
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                padding: "9px 18px",
                borderRadius: 10,
                fontSize: "0.84rem",
                fontWeight: 600,
                boxShadow: "0 2px 10px rgba(99, 102, 241, 0.25)",
              }}
            >
              <CheckCheck size={16} /> Mark All Read ({unreadCount})
            </button>
          )}

          <button
            onClick={() => setActiveTab("preferences")}
            style={{
              background: "var(--bg-secondary)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-primary)",
              padding: "9px 16px",
              borderRadius: 10,
              fontSize: "0.84rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Sliders size={15} /> Channel Settings
          </button>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="tab-navigation" style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--border-primary)", paddingBottom: 8, overflowX: "auto" }}>
        <button
          onClick={() => setActiveTab("in_app")}
          className={`nav-link ${activeTab === "in_app" ? "active" : ""}`}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: activeTab === "in_app" ? "var(--accent-primary)" : "transparent",
            color: activeTab === "in_app" ? "#fff" : "var(--text-secondary)",
            fontWeight: 600,
            fontSize: "0.86rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Bell size={16} /> In-App Notification Center
          {unreadCount > 0 && (
            <span style={{
              background: activeTab === "in_app" ? "rgba(255,255,255,0.3)" : "#ef4444",
              color: "#fff",
              padding: "2px 7px",
              borderRadius: 10,
              fontSize: "0.72rem",
              fontWeight: 700,
            }}>
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("preferences")}
          className={`nav-link ${activeTab === "preferences" ? "active" : ""}`}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: activeTab === "preferences" ? "var(--accent-primary)" : "transparent",
            color: activeTab === "preferences" ? "#fff" : "var(--text-secondary)",
            fontWeight: 600,
            fontSize: "0.86rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Sliders size={16} /> Notification Preferences
        </button>

        <button
          onClick={() => setActiveTab("email_outbox")}
          className={`nav-link ${activeTab === "email_outbox" ? "active" : ""}`}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: activeTab === "email_outbox" ? "var(--accent-primary)" : "transparent",
            color: activeTab === "email_outbox" ? "#fff" : "var(--text-secondary)",
            fontWeight: 600,
            fontSize: "0.86rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Mail size={16} /> Transactional Emails (SES / SendGrid)
          <span style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981", padding: "2px 6px", borderRadius: 6, fontSize: "0.72rem", fontWeight: 700 }}>
            {emailLogs.length} Outbox
          </span>
        </button>

        <button
          onClick={() => setActiveTab("push_manager")}
          className={`nav-link ${activeTab === "push_manager" ? "active" : ""}`}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: activeTab === "push_manager" ? "var(--accent-primary)" : "transparent",
            color: activeTab === "push_manager" ? "#fff" : "var(--text-secondary)",
            fontWeight: 600,
            fontSize: "0.86rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Smartphone size={16} /> Web Push (PWA)
        </button>

        {(user?.role === "teacher" || user?.role === "admin") && (
          <button
            onClick={() => setActiveTab("dispatch_console")}
            className={`nav-link ${activeTab === "dispatch_console" ? "active" : ""}`}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: activeTab === "dispatch_console" ? "var(--accent-primary)" : "transparent",
              color: activeTab === "dispatch_console" ? "#fff" : "var(--text-secondary)",
              fontWeight: 600,
              fontSize: "0.86rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Layers size={16} /> Engine Dispatch Console
            <span style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", padding: "2px 6px", borderRadius: 6, fontSize: "0.72rem", fontWeight: 700 }}>
              BullMQ
            </span>
          </button>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════
          TAB 1: IN-APP NOTIFICATION CENTER
         ════════════════════════════════════════════════════════════ */}
      {activeTab === "in_app" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Controls Bar: Category Chips, Search, Unread Filter */}
          <div className="card" style={{ padding: "14px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
              {/* Category Pills */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  { id: "all", label: "All Updates", count: notifications.length },
                  { id: "academic", label: "Academic", count: notifications.filter(n => n.type === "academic").length },
                  { id: "financial", label: "Financial", count: notifications.filter(n => n.type === "financial").length },
                  { id: "system", label: "System", count: notifications.filter(n => n.type === "system").length },
                  { id: "alert", label: "Security & Alerts", count: notifications.filter(n => n.type === "alert").length },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilter(f.id)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 20,
                      border: "1px solid",
                      borderColor: activeFilter === f.id ? "var(--accent-primary)" : "var(--border-primary)",
                      background: activeFilter === f.id ? "var(--accent-primary)" : "transparent",
                      color: activeFilter === f.id ? "#ffffff" : "var(--text-secondary)",
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      fontWeight: 600,
                      transition: "all 0.15s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>{f.label}</span>
                    <span style={{
                      fontSize: "0.72rem",
                      background: activeFilter === f.id ? "rgba(255,255,255,0.25)" : "var(--bg-secondary)",
                      padding: "1px 6px",
                      borderRadius: 10,
                    }}>
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search & Actions */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div style={{ position: "relative" }}>
                  <Search size={15} style={{ position: "absolute", left: 10, top: 10, color: "var(--text-secondary)" }} />
                  <input
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      padding: "7px 12px 7px 32px",
                      borderRadius: 8,
                      border: "1px solid var(--border-primary)",
                      background: "var(--bg-secondary)",
                      fontSize: "0.84rem",
                      width: 220,
                    }}
                  />
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem", color: "var(--text-secondary)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={unreadOnly}
                    onChange={(e) => setUnreadOnly(e.target.checked)}
                  />
                  <span>Unread Only</span>
                </label>

                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#ef4444",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      padding: "6px 10px",
                    }}
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Notifications Card List */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {loading ? (
              <div style={{ padding: 48, textAlign: "center", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                Loading notification feeds...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <EmptyState
                variant={searchQuery || activeFilter !== "all" ? "search" : "notifications"}
                title={searchQuery ? "No Notifications Matching Search" : "You're All Caught Up!"}
                description={
                  searchQuery
                    ? "No notifications match your current search terms or selected category filter."
                    : "There are no unread notifications or security alerts at this time."
                }
                action={
                  searchQuery || activeFilter !== "all"
                    ? {
                        label: "Clear Filter",
                        onClick: () => {
                          setSearchQuery("");
                          setActiveFilter("all");
                        },
                      }
                    : undefined
                }
              />
            ) : (
              filteredNotifications.map((notif, idx) => {
                const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system;
                const priorityBadge = PRIORITY_BADGES[notif.priority || "normal"];

                let deliveredChannels: Record<string, boolean> = {};
                try {
                  if (notif.channelsDelivered) deliveredChannels = JSON.parse(notif.channelsDelivered);
                } catch {}

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleMarkAsRead(notif.id)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 16,
                      padding: "18px 24px",
                      borderBottom: idx < filteredNotifications.length - 1 ? "1px solid var(--border-primary)" : "none",
                      background: notif.read ? "transparent" : "rgba(99, 102, 241, 0.035)",
                      cursor: "pointer",
                      position: "relative",
                      transition: "background 0.15s ease",
                    }}
                  >
                    {/* Unread Accent Bar */}
                    {!notif.read && (
                      <div style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 4,
                        background: "var(--accent-primary)",
                      }} />
                    )}

                    {/* Category Icon */}
                    <div style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: cfg.bg,
                      color: cfg.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 2,
                    }}>
                      {cfg.icon}
                    </div>

                    {/* Center Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          padding: "2px 8px",
                          borderRadius: 6,
                          background: cfg.bg,
                          color: cfg.color,
                        }}>
                          {cfg.label}
                        </span>

                        {notif.priority && notif.priority !== "normal" && (
                          <span style={{
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: priorityBadge.bg,
                            color: priorityBadge.color,
                          }}>
                            {priorityBadge.label}
                          </span>
                        )}

                        <span style={{ fontSize: "0.78rem", color: "var(--text-tertiary)" }}>
                          {formatTime(notif.createdAt)}
                        </span>
                      </div>

                      <div style={{
                        fontWeight: notif.read ? 600 : 700,
                        fontSize: "0.96rem",
                        color: "var(--text-primary)",
                        marginBottom: 4,
                      }}>
                        {notif.title}
                      </div>

                      <div style={{
                        fontSize: "0.86rem",
                        color: "var(--text-secondary)",
                        lineHeight: 1.5,
                      }}>
                        {notif.message}
                      </div>

                      {/* Delivery Badges & Deep Link Button */}
                      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 10, flexWrap: "wrap" }}>
                        {notif.link && (
                          <a
                            href={notif.link}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              color: "var(--accent-primary)",
                              textDecoration: "none",
                              background: "rgba(99, 102, 241, 0.08)",
                              padding: "4px 10px",
                              borderRadius: 6,
                            }}
                          >
                            Open Action Link <ExternalLink size={12} />
                          </a>
                        )}

                        {/* Delivery Channels Footprint */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem", color: "var(--text-tertiary)" }}>
                          <span>Channels:</span>
                          <span style={{ color: "#10b981", fontWeight: 600 }}>✓ In-App</span>
                          {deliveredChannels.email && <span style={{ color: "#3b82f6", fontWeight: 600 }}>✓ Email</span>}
                          {deliveredChannels.push && <span style={{ color: "#8b5cf6", fontWeight: 600 }}>✓ Push</span>}
                        </div>
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      {!notif.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notif.id);
                          }}
                          title="Mark as read"
                          style={{
                            background: "var(--bg-secondary)",
                            border: "1px solid var(--border-primary)",
                            padding: "6px 10px",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: "0.75rem",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            color: "var(--text-secondary)",
                          }}
                        >
                          <Check size={13} /> Read
                        </button>
                      )}

                      <button
                        onClick={(e) => handleDeleteNotification(notif.id, e)}
                        title="Delete notification"
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--text-tertiary)",
                          cursor: "pointer",
                          padding: 6,
                          borderRadius: 6,
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB 2: NOTIFICATION PREFERENCES MATRIX
         ════════════════════════════════════════════════════════════ */}
      {activeTab === "preferences" && (
        <form onSubmit={handleSavePreferences} className="card" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              Notification Delivery & Channel Preferences
            </h2>
            <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)", margin: 0 }}>
              Customize your communication channel matrix across Academic updates, Bursar statements, System announcements, and Early Warning alerts.
            </p>
          </div>

          {prefSavedMsg && (
            <div style={{ padding: "12px 16px", borderRadius: 8, background: "rgba(16, 185, 129, 0.12)", color: "#10b981", fontSize: "0.86rem", fontWeight: 600 }}>
              ✓ {prefSavedMsg}
            </div>
          )}

          {/* Notification Matrix Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-primary)", textAlign: "left" }}>
                  <th style={{ padding: "12px 14px", color: "var(--text-secondary)", width: "40%" }}>Category</th>
                  <th style={{ padding: "12px 14px", textAlign: "center", color: "var(--text-secondary)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <Bell size={15} /> In-App Center
                    </div>
                  </th>
                  <th style={{ padding: "12px 14px", textAlign: "center", color: "var(--text-secondary)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <Mail size={15} /> Email (SendGrid/SES)
                    </div>
                  </th>
                  <th style={{ padding: "12px 14px", textAlign: "center", color: "var(--text-secondary)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <Smartphone size={15} /> Web Push (PWA)
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Academic Row */}
                <tr style={{ borderBottom: "1px solid var(--border-primary)" }}>
                  <td style={{ padding: "16px 14px" }}>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>Academic Updates</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>Grade publication, marksheet certificate ready, exam timetable release.</div>
                  </td>
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={preferences.academicInApp}
                      onChange={(e) => setPreferences({ ...preferences, academicInApp: e.target.checked })}
                    />
                  </td>
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={preferences.academicEmail}
                      onChange={(e) => setPreferences({ ...preferences, academicEmail: e.target.checked })}
                    />
                  </td>
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={preferences.academicPush}
                      onChange={(e) => setPreferences({ ...preferences, academicPush: e.target.checked })}
                    />
                  </td>
                </tr>

                {/* Financial Row */}
                <tr style={{ borderBottom: "1px solid var(--border-primary)" }}>
                  <td style={{ padding: "16px 14px" }}>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>Financial & Bursar</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>Fee invoices, payment receipts, due date notices, late payment holds.</div>
                  </td>
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={preferences.financialInApp}
                      onChange={(e) => setPreferences({ ...preferences, financialInApp: e.target.checked })}
                    />
                  </td>
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={preferences.financialEmail}
                      onChange={(e) => setPreferences({ ...preferences, financialEmail: e.target.checked })}
                    />
                  </td>
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={preferences.financialPush}
                      onChange={(e) => setPreferences({ ...preferences, financialPush: e.target.checked })}
                    />
                  </td>
                </tr>

                {/* System Row */}
                <tr style={{ borderBottom: "1px solid var(--border-primary)" }}>
                  <td style={{ padding: "16px 14px" }}>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>System & Portal Maintenance</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>Platform upgrades, scheduled downtime, institutional newsletters.</div>
                  </td>
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={preferences.systemInApp}
                      onChange={(e) => setPreferences({ ...preferences, systemInApp: e.target.checked })}
                    />
                  </td>
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={preferences.systemEmail}
                      onChange={(e) => setPreferences({ ...preferences, systemEmail: e.target.checked })}
                    />
                  </td>
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={preferences.systemPush}
                      onChange={(e) => setPreferences({ ...preferences, systemPush: e.target.checked })}
                    />
                  </td>
                </tr>

                {/* Alerts Row */}
                <tr style={{ borderBottom: "1px solid var(--border-primary)" }}>
                  <td style={{ padding: "16px 14px" }}>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>Early Warning & Safety Alerts</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>Low attendance warnings, academic risk prediction, campus emergencies.</div>
                  </td>
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={preferences.alertInApp}
                      onChange={(e) => setPreferences({ ...preferences, alertInApp: e.target.checked })}
                    />
                  </td>
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={preferences.alertEmail}
                      onChange={(e) => setPreferences({ ...preferences, alertEmail: e.target.checked })}
                    />
                  </td>
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={preferences.alertPush}
                      onChange={(e) => setPreferences({ ...preferences, alertPush: e.target.checked })}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Delivery Frequency & Quiet Hours */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Frequency Selection */}
            <div style={{ background: "var(--bg-secondary)", padding: 18, borderRadius: 12, border: "1px solid var(--border-primary)" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", display: "block", marginBottom: 6 }}>
                Digest Delivery Cadence
              </label>
              <select
                value={preferences.frequency}
                onChange={(e: any) => setPreferences({ ...preferences, frequency: e.target.value })}
                style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
              >
                <option value="instant">Instant Real-Time (Immediate dispatch)</option>
                <option value="daily_digest">Daily Evening Digest (Summarized at 18:00)</option>
                <option value="weekly">Weekly Summary (Mondays at 09:00)</option>
              </select>
            </div>

            {/* Quiet Hours Configuration */}
            <div style={{ background: "var(--bg-secondary)", padding: 18, borderRadius: 12, border: "1px solid var(--border-primary)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                  <Moon size={15} /> Quiet Hours (Mute Non-Urgent Push/Email)
                </label>
                <input
                  type="checkbox"
                  checked={preferences.quietHoursEnabled}
                  onChange={(e) => setPreferences({ ...preferences, quietHoursEnabled: e.target.checked })}
                />
              </div>

              {preferences.quietHoursEnabled && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
                  <div>
                    <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>From</label>
                    <input
                      type="time"
                      value={preferences.quietHoursStart}
                      onChange={(e) => setPreferences({ ...preferences, quietHoursStart: e.target.value })}
                      style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid var(--border-primary)", background: "var(--bg-primary)" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Until</label>
                    <input
                      type="time"
                      value={preferences.quietHoursEnd}
                      onChange={(e) => setPreferences({ ...preferences, quietHoursEnd: e.target.value })}
                      style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid var(--border-primary)", background: "var(--bg-primary)" }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={prefSaving}
              style={{
                padding: "10px 24px",
                borderRadius: 8,
                border: "none",
                background: "var(--accent-primary)",
                color: "#ffffff",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {prefSaving ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        </form>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB 3: TRANSACTIONAL EMAILS OUTBOX & HTML PREVIEWS
         ════════════════════════════════════════════════════════════ */}
      {activeTab === "email_outbox" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card" style={{ padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                  Transactional Email Dispatcher (SendGrid / AWS SES)
                </h3>
                <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)", margin: 0 }}>
                  High-deliverability academic notifications formatted in responsive HTML templates. Click any email to preview rendered layout.
                </p>
              </div>

              <button
                onClick={fetchEmailLogs}
                style={{
                  background: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-primary)",
                  padding: "8px 14px",
                  borderRadius: 8,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <RefreshCw size={14} /> Refresh Outbox
              </button>
            </div>
          </div>

          {/* Email Outbox Table */}
          <div className="card" style={{ padding: 0, overflowX: "auto" }}>
            {emailLogs.length === 0 ? (
              <EmptyState
                variant="general"
                title="Email Outbox Empty"
                description="No transactional emails have been dispatched yet in this session. Alerts sent to students or faculty will show here."
              />
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border-primary)", textAlign: "left", color: "var(--text-secondary)" }}>
                    <th style={{ padding: "12px 16px" }}>Recipient</th>
                    <th style={{ padding: "12px 16px" }}>Subject</th>
                    <th style={{ padding: "12px 16px" }}>Template</th>
                    <th style={{ padding: "12px 16px" }}>Provider Adapter</th>
                    <th style={{ padding: "12px 16px" }}>Timestamp</th>
                    <th style={{ padding: "12px 16px", textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {emailLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: "1px solid var(--border-primary)" }}>
                      <td style={{ padding: "14px 16px", fontWeight: 600 }}>{log.to}</td>
                      <td style={{ padding: "14px 16px", color: "var(--text-primary)" }}>{log.subject}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          padding: "3px 8px",
                          borderRadius: 6,
                          fontSize: "0.74rem",
                          fontWeight: 700,
                          background: "rgba(99, 102, 241, 0.12)",
                          color: "#6366f1",
                        }}>
                          {log.template}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          padding: "3px 8px",
                          borderRadius: 6,
                          fontSize: "0.74rem",
                          fontWeight: 700,
                          background: log.provider === "sendgrid" ? "rgba(59, 130, 246, 0.15)" : log.provider === "aws_ses" ? "rgba(245, 158, 11, 0.15)" : "rgba(16, 185, 129, 0.15)",
                          color: log.provider === "sendgrid" ? "#3b82f6" : log.provider === "aws_ses" ? "#d97706" : "#10b981",
                        }}>
                          {log.provider.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", color: "var(--text-secondary)", fontSize: "0.78rem" }}>
                        {new Date(log.sentAt).toLocaleTimeString()}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <button
                          onClick={() => setSelectedEmail(log)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 6,
                            border: "1px solid var(--border-primary)",
                            background: "var(--bg-secondary)",
                            cursor: "pointer",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          <Eye size={13} /> Preview HTML
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Email Preview Modal */}
          {selectedEmail && (
            <div style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(6px)",
              zIndex: 3000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
            }}>
              <div style={{
                background: "#ffffff",
                color: "#0f172a",
                borderRadius: 16,
                maxWidth: 720,
                width: "100%",
                maxHeight: "90vh",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
              }}>
                <div style={{
                  padding: "16px 24px",
                  background: "#1e1b4b",
                  color: "#ffffff",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <div>
                    <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#a5b4fc", fontWeight: 700 }}>
                      Rendered Email Preview ({selectedEmail.provider})
                    </div>
                    <div style={{ fontSize: "1.05rem", fontWeight: 700 }}>{selectedEmail.subject}</div>
                  </div>
                  <button
                    onClick={() => setSelectedEmail(null)}
                    style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer" }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: 24, background: "#f1f5f9" }}>
                  <div
                    dangerouslySetInnerHTML={{ __html: selectedEmail.htmlContent }}
                    style={{ maxWidth: 600, margin: "0 auto" }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB 4: WEB PUSH (PWA) MANAGER
         ════════════════════════════════════════════════════════════ */}
      {activeTab === "push_manager" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="card" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                Progressive Web App (PWA) Web Push Notifications
              </h3>
              <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)", margin: 0 }}>
                Deliver instantaneous system updates to candidates' mobile and desktop browsers even when the portal is closed.
              </p>
            </div>

            {pushStatusMsg && (
              <div style={{ padding: "12px 16px", borderRadius: 8, background: "rgba(16, 185, 129, 0.12)", color: "#10b981", fontSize: "0.86rem", fontWeight: 600 }}>
                ✓ {pushStatusMsg}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
              {/* Permission Status Card */}
              <div style={{ background: "var(--bg-secondary)", padding: 20, borderRadius: 12, border: "1px solid var(--border-primary)" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 700 }}>
                  Browser Permission State
                </div>
                <div style={{
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  marginTop: 6,
                  color: pushPermission === "granted" ? "#10b981" : pushPermission === "denied" ? "#ef4444" : "#f59e0b",
                }}>
                  {pushPermission.toUpperCase()}
                </div>
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: "8px 0 16px" }}>
                  {pushPermission === "granted"
                    ? "Service Worker is registered and authorized to receive push dispatches."
                    : "Browser notifications have not been granted yet."}
                </p>

                {pushPermission !== "granted" && (
                  <button
                    onClick={handleEnableWebPush}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 8,
                      border: "none",
                      background: "var(--accent-primary)",
                      color: "#fff",
                      fontWeight: 600,
                      fontSize: "0.84rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Smartphone size={15} /> Request Push Permission
                  </button>
                )}
              </div>

              {/* Public VAPID Key Card */}
              <div style={{ background: "var(--bg-secondary)", padding: 20, borderRadius: 12, border: "1px solid var(--border-primary)" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 700 }}>
                  Application Server VAPID Public Key
                </div>
                <div style={{
                  fontFamily: "monospace",
                  fontSize: "0.74rem",
                  color: "var(--text-primary)",
                  wordBreak: "break-all",
                  background: "var(--bg-primary)",
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid var(--border-primary)",
                  marginTop: 8,
                }}>
                  {vapidPublicKey || "Loading VAPID key..."}
                </div>
                <p style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", marginTop: 8 }}>
                  Cryptographic identity handshake ensuring only authorized ScholarPulse servers can push to client devices.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB 5: NOTIFICATION ENGINE DISPATCH CONSOLE (TESTING)
         ════════════════════════════════════════════════════════════ */}
      {activeTab === "dispatch_console" && (
        <form onSubmit={handleDispatchNotification} className="card" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              Event-Driven Queue Dispatcher & Testing Console
            </h3>
            <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)", margin: 0 }}>
              Dispatch simulated events through the Redis / BullMQ queue pipeline to verify multi-channel delivery (In-App, Email, Push) in real-time.
            </p>
          </div>

          {dispatchSuccessMsg && (
            <div style={{ padding: "12px 16px", borderRadius: 8, background: "rgba(16, 185, 129, 0.12)", color: "#10b981", fontSize: "0.86rem", fontWeight: 600 }}>
              ✓ {dispatchSuccessMsg}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, display: "block", marginBottom: 6 }}>Category Type</label>
              <select
                value={dispatchType}
                onChange={(e: any) => setDispatchType(e.target.value)}
                style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-secondary)" }}
              >
                <option value="academic">Academic (Grade / Timetable)</option>
                <option value="financial">Financial (Bursar / Fee Due)</option>
                <option value="alert">Security Alert / Early Warning</option>
                <option value="system">System Notice</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, display: "block", marginBottom: 6 }}>Queue Priority</label>
              <select
                value={dispatchPriority}
                onChange={(e: any) => setDispatchPriority(e.target.value)}
                style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-secondary)" }}
              >
                <option value="normal">Normal (Standard)</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent (Bypasses Quiet Hours)</option>
                <option value="low">Low (Background)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, display: "block", marginBottom: 6 }}>Email Template</label>
              <select
                value={dispatchEmailTemplate}
                onChange={(e: any) => setDispatchEmailTemplate(e.target.value)}
                style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-secondary)" }}
              >
                <option value="grade_posted">Grade Posted (Exam Marksheet)</option>
                <option value="fee_due">Fee Due (Invoice Statement)</option>
                <option value="risk_alert">Academic Risk Advisory</option>
                <option value="exam_scheduled">Exam Scheduled</option>
                <option value="system_alert">System Notice</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: "0.82rem", fontWeight: 600, display: "block", marginBottom: 6 }}>Notification Title</label>
            <input
              required
              placeholder="e.g. Midterm Results Released: CS301"
              value={dispatchTitle}
              onChange={(e) => setDispatchTitle(e.target.value)}
              style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-secondary)" }}
            />
          </div>

          <div>
            <label style={{ fontSize: "0.82rem", fontWeight: 600, display: "block", marginBottom: 6 }}>Notification Body Message</label>
            <textarea
              required
              rows={3}
              placeholder="Enter comprehensive notification announcement..."
              value={dispatchMessage}
              onChange={(e) => setDispatchMessage(e.target.value)}
              style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-secondary)" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, display: "block", marginBottom: 6 }}>Target Deep Link</label>
              <input
                placeholder="/dashboard/exams"
                value={dispatchLink}
                onChange={(e) => setDispatchLink(e.target.value)}
                style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-secondary)" }}
              >
              </input>
            </div>

            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, display: "block", marginBottom: 6 }}>Delivery Channels</label>
              <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={channelInApp}
                    onChange={(e) => setChannelInApp(e.target.checked)}
                  />
                  <span>In-App</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={channelEmail}
                    onChange={(e) => setChannelEmail(e.target.checked)}
                  />
                  <span>Email</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={channelPush}
                    onChange={(e) => setChannelPush(e.target.checked)}
                  />
                  <span>Web Push</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isDispatching}
              style={{
                padding: "10px 24px",
                borderRadius: 8,
                border: "none",
                background: "var(--accent-primary)",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "0.86rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Send size={15} /> {isDispatching ? "Enqueuing Job..." : "Enqueue Notification to BullMQ"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
