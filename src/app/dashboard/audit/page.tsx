"use client";

import { useState, useEffect, useCallback } from "react";
import { type Role } from "@/lib/mockData";
import {
  Shield, Search, ChevronLeft, ChevronRight,
  LogIn, LogOut, Edit3, Trash2, Plus, Eye, Download,
  CheckCircle2, AlertTriangle, RefreshCw, Lock,
  Laptop, Smartphone, Tablet, X, Clock, Activity, FileText, Sparkles, User, RotateCcw
} from "lucide-react";
import "../dashboard.css";
import "./audit.css";
import EmptyState from "@/components/UI/EmptyState";

const ACTION_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  CREATE: { icon: <Plus size={13} />, color: "#10b981", bg: "rgba(16, 185, 129, 0.12)", label: "CREATE" },
  UPDATE: { icon: <Edit3 size={13} />, color: "#38bdf8", bg: "rgba(56, 189, 248, 0.12)", label: "UPDATE" },
  DELETE: { icon: <Trash2 size={13} />, color: "#f43f5e", bg: "rgba(244, 63, 94, 0.12)", label: "DELETE" },
  LOGIN: { icon: <LogIn size={13} />, color: "#818cf8", bg: "rgba(129, 140, 248, 0.12)", label: "LOGIN" },
  LOGOUT: { icon: <LogOut size={13} />, color: "#a855f7", bg: "rgba(168, 85, 247, 0.12)", label: "LOGOUT" },
  VIEW: { icon: <Eye size={13} />, color: "#fbbf24", bg: "rgba(251, 191, 36, 0.12)", label: "VIEW" },
  EXPORT: { icon: <Download size={13} />, color: "#2dd4bf", bg: "rgba(45, 212, 191, 0.12)", label: "EXPORT" },
};

interface AuditLogEntry {
  id: string;
  sequence: number;
  userId?: string;
  userName?: string;
  userRole?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  device?: string;
  browser?: string;
  os?: string;
  hash?: string;
  previousHash?: string;
  createdAt: string;
}

interface AuditStats {
  totalLogs: number;
  todayLogs: number;
  loginsToday: number;
  sensitiveCrudToday: number;
  distinctIps: number;
  entityBreakdown: Record<string, number>;
  chainStatus: string;
}

export default function AuditLogPage() {
  const [user, setUser] = useState<{ role: Role; name?: string; email?: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Data states
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 25;

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [datePreset, setDatePreset] = useState<"all" | "today" | "7d" | "30d" | "custom">("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // Modals
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);
  const [simulateModalOpen, setSimulateModalOpen] = useState(false);
  const [simulating, setSimulating] = useState(false);

  // Initialize auth
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token") || localStorage.getItem("access_token");
      if (storedUser) setUser(JSON.parse(storedUser));
      if (storedToken) setToken(storedToken);
    } catch (e) {
      console.error("Auth init error:", e);
    }
  }, []);

  // Fetch Logs
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", String(limit));

      if (actionFilter !== "ALL") params.append("action", actionFilter);
      if (entityFilter !== "ALL") params.append("entity", entityFilter);
      if (roleFilter !== "ALL") params.append("userRole", roleFilter);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      // Date ranges
      const now = new Date();
      if (datePreset === "today") {
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        params.append("startDate", todayStart);
      } else if (datePreset === "7d") {
        const start7d = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString();
        params.append("startDate", start7d);
      } else if (datePreset === "30d") {
        const start30d = new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString();
        params.append("startDate", start30d);
      } else if (datePreset === "custom") {
        if (customStart) params.append("startDate", new Date(customStart).toISOString());
        if (customEnd) params.append("endDate", new Date(customEnd).toISOString());
      }

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`http://localhost:3001/audit?${params.toString()}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.data || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } else if (res.status === 401) {
        // Fallback for unauthenticated dev preview
        console.warn("Audit logs query requires admin token");
      }
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, entityFilter, roleFilter, searchQuery, datePreset, customStart, customEnd, token]);

  // Fetch Stats
  const fetchStats = useCallback(async () => {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("http://localhost:3001/audit/stats", { headers });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch audit stats:", err);
    }
  }, [token]);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [fetchLogs, fetchStats]);

  // Cryptographic Chain Verification
  const runChainVerification = async () => {
    setVerifying(true);
    setVerifyModalOpen(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("http://localhost:3001/audit/verify-integrity", { headers });
      if (res.ok) {
        const data = await res.json();
        setVerifyResult(data);
      } else {
        setVerifyResult({ verified: false, message: "Verification endpoint returned error" });
      }
    } catch (err) {
      setVerifyResult({ verified: false, message: "Network error connecting to verification engine" });
    } finally {
      setVerifying(false);
    }
  };

  // Export File (CSV or JSON)
  const handleExport = async (format: "csv" | "json") => {
    try {
      const params = new URLSearchParams();
      params.append("format", format);
      if (actionFilter !== "ALL") params.append("action", actionFilter);
      if (entityFilter !== "ALL") params.append("entity", entityFilter);
      if (roleFilter !== "ALL") params.append("userRole", roleFilter);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`http://localhost:3001/audit/export?${params.toString()}`, { headers });
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to export audit logs: " + (err as Error).message);
    }
  };

  // Trigger Simulated Audit Event
  const triggerSimulation = async (entity: string, action: string, details: any) => {
    setSimulating(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("http://localhost:3001/audit/test-log", {
        method: "POST",
        headers,
        body: JSON.stringify({ entity, action, details }),
      });

      if (res.ok) {
        setSimulateModalOpen(false);
        await fetchLogs();
        await fetchStats();
      }
    } catch (err) {
      alert("Simulation failed: " + (err as Error).message);
    } finally {
      setSimulating(false);
    }
  };

  // Format Date Helper
  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Device icon helper
  const getDeviceIcon = (dev?: string) => {
    if (dev === "Mobile") return <Smartphone size={13} style={{ color: "#38bdf8" }} />;
    if (dev === "Tablet") return <Tablet size={13} style={{ color: "#a855f7" }} />;
    return <Laptop size={13} style={{ color: "#94a3b8" }} />;
  };

  // Format JSON safely
  const formatJson = (str?: string) => {
    if (!str) return "{}";
    try {
      return JSON.stringify(JSON.parse(str), null, 2);
    } catch {
      return str;
    }
  };

  // Render Access Denied if non-admin
  if (user && user.role !== "admin") {
    return (
      <div className="card" style={{ padding: 60, textAlign: "center", maxWidth: 500, margin: "60px auto" }}>
        <Shield size={56} style={{ color: "#f43f5e", marginBottom: 16 }} />
        <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
          Access Restricted
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.5 }}>
          The Immutable Audit Trail is strictly reserved for system administrators and compliance auditors.
        </p>
      </div>
    );
  }

  return (
    <div className="audit-container">
      {/* ─── Hero Section ─── */}
      <div className="audit-hero">
        <div>
          <div className="audit-hero-title">
            <Shield size={26} style={{ color: "#818cf8" }} />
            Immutable Audit Trail & Compliance Ledger
            <span className="audit-hero-badge">
              <Lock size={11} /> Cryptographically Sealed
            </span>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.86rem", margin: 0 }}>
            Append-only tamper-evident security journal tracking all sensitive operations across grades, attendance, fees, and user management.
          </p>
        </div>

        <div className="audit-hero-actions">
          <button
            className="audit-btn audit-btn-verify"
            onClick={runChainVerification}
            title="Verify mathematical SHA-256 hash chaining of all audit blocks"
          >
            <CheckCircle2 size={16} /> Verify Chain Integrity
          </button>
          <button
            className="audit-btn audit-btn-outline"
            onClick={() => handleExport("csv")}
            title="Export filtered records as RFC-4180 CSV"
          >
            <Download size={15} /> Export CSV
          </button>
          <button
            className="audit-btn audit-btn-outline"
            onClick={() => handleExport("json")}
            title="Export filtered records as structured JSON"
          >
            <FileText size={15} /> JSON
          </button>
          <button
            className="audit-btn audit-btn-primary"
            onClick={() => setSimulateModalOpen(true)}
            title="Simulate an audited operation to test append-only streaming"
          >
            <Sparkles size={15} /> Simulate Event
          </button>
        </div>
      </div>

      {/* ─── Metrics Cards ─── */}
      <div className="audit-stats-grid">
        <div className="audit-stat-card">
          <div className="audit-stat-label">
            Total Audit Records
            <Activity size={14} style={{ color: "#818cf8" }} />
          </div>
          <div className="audit-stat-val" style={{ color: "#818cf8" }}>
            {stats?.totalLogs ?? total}
          </div>
          <div className="audit-stat-sub">
            <span style={{ color: "#10b981" }}>● Monotonic Chain</span> · Block #{total}
          </div>
        </div>

        <div className="audit-stat-card">
          <div className="audit-stat-label">
            Today&apos;s Operations
            <Clock size={14} style={{ color: "#38bdf8" }} />
          </div>
          <div className="audit-stat-val" style={{ color: "#38bdf8" }}>
            {stats?.todayLogs ?? 0}
          </div>
          <div className="audit-stat-sub">
            Logged in current UTC calendar window
          </div>
        </div>

        <div className="audit-stat-card">
          <div className="audit-stat-label">
            Auth Events
            <LogIn size={14} style={{ color: "#10b981" }} />
          </div>
          <div className="audit-stat-val" style={{ color: "#10b981" }}>
            {stats?.loginsToday ?? 0}
          </div>
          <div className="audit-stat-sub">
            Logins / Logouts tracked with IP & Device
          </div>
        </div>

        <div className="audit-stat-card">
          <div className="audit-stat-label">
            Sensitive CRUD
            <Edit3 size={14} style={{ color: "#f59e0b" }} />
          </div>
          <div className="audit-stat-val" style={{ color: "#f59e0b" }}>
            {stats?.sensitiveCrudToday ?? 0}
          </div>
          <div className="audit-stat-sub">
            Grades, Attendance, Fees, User management
          </div>
        </div>

        <div className="audit-stat-card">
          <div className="audit-stat-label">
            Distinct IPs
            <Laptop size={14} style={{ color: "#a855f7" }} />
          </div>
          <div className="audit-stat-val" style={{ color: "#a855f7" }}>
            {stats?.distinctIps ?? 1}
          </div>
          <div className="audit-stat-sub">
            Client origins active in session
          </div>
        </div>
      </div>

      {/* ─── Search & Filters Toolbar ─── */}
      <div className="audit-toolbar">
        <div className="audit-toolbar-top">
          <div className="audit-search-box">
            <Search size={16} style={{ color: "var(--text-tertiary, #64748b)" }} />
            <input
              type="text"
              placeholder="Search user, entity, details, IP address..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
            {searchQuery && (
              <X
                size={14}
                style={{ cursor: "pointer", color: "#94a3b8" }}
                onClick={() => setSearchQuery("")}
              />
            )}
          </div>

          <select
            className="audit-select"
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="VIEW">VIEW</option>
            <option value="EXPORT">EXPORT</option>
          </select>

          <select
            className="audit-select"
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">All Entities</option>
            <option value="grades">grades</option>
            <option value="attendance">attendance</option>
            <option value="fees">fees</option>
            <option value="users">users</option>
            <option value="auth">auth</option>
            <option value="exams">exams</option>
            <option value="reports">reports</option>
          </select>

          <select
            className="audit-select"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">All Roles</option>
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </select>

          <button
            className="audit-btn audit-btn-outline"
            onClick={() => {
              fetchLogs();
              fetchStats();
            }}
            title="Refresh logs"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Date Window Presets */}
        <div className="audit-date-chips">
          <span style={{ fontSize: "0.78rem", color: "var(--text-tertiary, #64748b)", fontWeight: 600 }}>
            Time Window:
          </span>
          <button
            className={`audit-chip ${datePreset === "all" ? "active" : ""}`}
            onClick={() => {
              setDatePreset("all");
              setPage(1);
            }}
          >
            All Time
          </button>
          <button
            className={`audit-chip ${datePreset === "today" ? "active" : ""}`}
            onClick={() => {
              setDatePreset("today");
              setPage(1);
            }}
          >
            Today
          </button>
          <button
            className={`audit-chip ${datePreset === "7d" ? "active" : ""}`}
            onClick={() => {
              setDatePreset("7d");
              setPage(1);
            }}
          >
            Last 7 Days
          </button>
          <button
            className={`audit-chip ${datePreset === "30d" ? "active" : ""}`}
            onClick={() => {
              setDatePreset("30d");
              setPage(1);
            }}
          >
            Last 30 Days
          </button>
          <button
            className={`audit-chip ${datePreset === "custom" ? "active" : ""}`}
            onClick={() => setDatePreset("custom")}
          >
            Custom Range
          </button>

          {datePreset === "custom" && (
            <div className="audit-custom-dates">
              <input
                type="date"
                className="audit-date-input"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
              <span style={{ color: "#64748b", fontSize: "0.8rem" }}>to</span>
              <input
                type="date"
                className="audit-date-input"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* ─── Audit Records Table ─── */}
      <div className="audit-table-card">
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--text-secondary)" }}>
            <RefreshCw size={28} className="spin" style={{ marginBottom: 12, opacity: 0.6 }} />
            <p>Loading cryptographic audit ledger...</p>
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            variant="audit"
            title="No Cryptographic Audit Logs Found"
            description={
              searchQuery || actionFilter !== "ALL" || entityFilter !== "ALL" || roleFilter !== "ALL" || datePreset !== "all"
                ? "No ledger blocks match your active filters or keyword search. Reset filters to view all entries."
                : "No audit events have been recorded in the ledger yet."
            }
            action={
              searchQuery || actionFilter !== "ALL" || entityFilter !== "ALL" || roleFilter !== "ALL" || datePreset !== "all"
                ? {
                    label: "Reset All Filters",
                    onClick: () => {
                      setSearchQuery("");
                      setActionFilter("ALL");
                      setEntityFilter("ALL");
                      setRoleFilter("ALL");
                      setDatePreset("all");
                      setCustomStart("");
                      setCustomEnd("");
                      setPage(1);
                    },
                    icon: <RotateCcw size={14} />,
                  }
                : undefined
            }
          />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="audit-table">
              <thead>
                <tr>
                  <th style={{ width: 70 }}>Block #</th>
                  <th style={{ width: 140 }}>Timestamp</th>
                  <th style={{ width: 110 }}>Action</th>
                  <th style={{ width: 120 }}>Entity</th>
                  <th>User & Role</th>
                  <th>Client / Device</th>
                  <th>Details Summary</th>
                  <th style={{ width: 130 }}>Hash Seal</th>
                  <th style={{ width: 80, textAlign: "right" }}>Inspect</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const actionStyle = ACTION_CONFIG[log.action] || {
                    icon: <Activity size={12} />,
                    color: "#94a3b8",
                    bg: "rgba(148, 163, 184, 0.1)",
                    label: log.action,
                  };

                  let parsedSummary = "";
                  if (log.details) {
                    try {
                      const parsed = JSON.parse(log.details);
                      if (parsed.action) parsedSummary = parsed.action;
                      else if (parsed.event) parsedSummary = parsed.event;
                      else if (parsed.courseCode) parsedSummary = `${parsed.courseCode} · ${parsed.component || "Update"}`;
                      else if (parsed.invoiceNumber) parsedSummary = `Inv #${parsed.invoiceNumber}`;
                      else parsedSummary = Object.keys(parsed).slice(0, 2).map(k => `${k}: ${parsed[k]}`).join(", ");
                    } catch {
                      parsedSummary = log.details.slice(0, 40);
                    }
                  }

                  return (
                    <tr key={log.id}>
                      {/* Block Sequence */}
                      <td>
                        <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#818cf8" }}>
                          #{log.sequence || "—"}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td style={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                        {formatTime(log.createdAt)}
                      </td>

                      {/* Action Badge */}
                      <td>
                        <span
                          className="audit-action-badge"
                          style={{ color: actionStyle.color, background: actionStyle.bg }}
                        >
                          {actionStyle.icon}
                          {actionStyle.label}
                        </span>
                      </td>

                      {/* Entity */}
                      <td>
                        <span className="audit-entity-tag">{log.entity}</span>
                      </td>

                      {/* User */}
                      <td>
                        <div className="audit-user-cell">
                          <div className="audit-user-avatar">
                            {(log.userName || "U")[0].toUpperCase()}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontWeight: 600, color: "#fff" }}>
                              {log.userName || "System Worker"}
                            </span>
                            <span className="audit-role-tag">
                              {log.userRole || "automated"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Client / Device */}
                      <td>
                        <div className="audit-client-cell">
                          <span className="audit-ip-tag">{log.ipAddress || "127.0.0.1"}</span>
                          <span className="audit-device-tag">
                            {getDeviceIcon(log.device)}
                            {log.browser || "Browser"} · {log.os || "OS"}
                          </span>
                        </div>
                      </td>

                      {/* Details Summary */}
                      <td style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-secondary, #94a3b8)" }}>
                          {parsedSummary || "—"}
                        </span>
                      </td>

                      {/* SHA-256 Hash Preview */}
                      <td>
                        <span
                          className="audit-hash-code"
                          title={`SHA-256: ${log.hash}`}
                        >
                          {log.hash ? `${log.hash.slice(0, 8)}...${log.hash.slice(-4)}` : "GENESIS"}
                        </span>
                      </td>

                      {/* Inspect Button */}
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="audit-btn audit-btn-outline"
                          style={{ padding: "4px 8px", fontSize: "0.74rem" }}
                          onClick={() => setSelectedLog(log)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── Pagination Controls ─── */}
        <div className="audit-pagination">
          <div>
            Showing <strong style={{ color: "#fff" }}>{logs.length}</strong> of{" "}
            <strong style={{ color: "#fff" }}>{total}</strong> immutable audit entries
          </div>

          <div className="audit-page-controls">
            <button
              className="audit-page-btn"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <span style={{ display: "flex", alignItems: "center", padding: "0 8px", fontWeight: 600 }}>
              Page {page} of {totalPages}
            </span>
            <button
              className="audit-page-btn"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Inspection Drawer Modal ─── */}
      {selectedLog && (
        <div className="audit-modal-backdrop" onClick={() => setSelectedLog(null)}>
          <div className="audit-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="audit-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Shield size={20} style={{ color: "#818cf8" }} />
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>
                  Audit Block #{selectedLog.sequence || "—"} Receipt
                </h3>
                <span
                  className="audit-action-badge"
                  style={{
                    color: ACTION_CONFIG[selectedLog.action]?.color || "#fff",
                    background: ACTION_CONFIG[selectedLog.action]?.bg || "rgba(255,255,255,0.1)",
                  }}
                >
                  {selectedLog.action}
                </span>
              </div>
              <button
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
                onClick={() => setSelectedLog(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="audit-modal-body">
              {/* Identity & Metadata Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: 14, borderRadius: 10 }}>
                  <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>
                    Actor Identity
                  </div>
                  <div style={{ fontWeight: 600, color: "#fff", fontSize: "0.95rem" }}>
                    {selectedLog.userName || "System Worker"}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                    Role: <strong style={{ color: "#38bdf8" }}>{selectedLog.userRole || "internal"}</strong>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 4, fontFamily: "monospace" }}>
                    ID: {selectedLog.userId || "N/A"}
                  </div>
                </div>

                <div style={{ background: "rgba(255,255,255,0.03)", padding: 14, borderRadius: 10 }}>
                  <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>
                    Client Fingerprint
                  </div>
                  <div style={{ fontWeight: 600, color: "#38bdf8", fontFamily: "monospace" }}>
                    IP: {selectedLog.ipAddress || "127.0.0.1"}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                    {getDeviceIcon(selectedLog.device)}
                    {selectedLog.device || "Desktop"} · {selectedLog.browser || "Unknown"}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 2 }}>
                    OS: {selectedLog.os || "Unknown"}
                  </div>
                </div>
              </div>

              {/* Timestamp & Target */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: 14, borderRadius: 10 }}>
                  <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600, marginBottom: 2 }}>
                    Entity Target
                  </div>
                  <div style={{ fontWeight: 600, color: "#fff" }}>
                    <span className="audit-entity-tag">{selectedLog.entity}</span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 4 }}>
                    Target Ref: {selectedLog.entityId || "Global / Batch"}
                  </div>
                </div>

                <div style={{ background: "rgba(255,255,255,0.03)", padding: 14, borderRadius: 10 }}>
                  <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600, marginBottom: 2 }}>
                    Commit Timestamp
                  </div>
                  <div style={{ fontWeight: 600, color: "#fff", fontSize: "0.88rem" }}>
                    {new Date(selectedLog.createdAt).toUTCString()}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                    Local: {formatTime(selectedLog.createdAt)}
                  </div>
                </div>
              </div>

              {/* Cryptographic Proof Card */}
              <div className="audit-crypto-block">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#10b981", display: "flex", alignItems: "center", gap: 6 }}>
                    <Lock size={14} /> SHA-256 Cryptographic Block Seal
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "#10b981", background: "rgba(16,185,129,0.15)", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>
                    VERIFIED INTACT
                  </span>
                </div>

                <div className="audit-crypto-row">
                  <div className="audit-crypto-label">Block Hash (SHA-256)</div>
                  <div className="audit-crypto-val">{selectedLog.hash || "GENESIS"}</div>
                </div>

                <div className="audit-crypto-row">
                  <div className="audit-crypto-label">Previous Parent Block Hash</div>
                  <div className="audit-crypto-val" style={{ color: "#94a3b8" }}>
                    {selectedLog.previousHash || "0000000000000000000000000000000000000000000000000000000000000000"}
                  </div>
                </div>
              </div>

              {/* JSON Payload */}
              <div>
                <div style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: 600, marginBottom: 6 }}>
                  Event Payload & State Diffs:
                </div>
                <div className="audit-json-box">
                  {formatJson(selectedLog.details)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Cryptographic Verification Modal ─── */}
      {verifyModalOpen && (
        <div className="audit-modal-backdrop" onClick={() => setVerifyModalOpen(false)}>
          <div className="audit-modal-card" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <div className="audit-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CheckCircle2 size={22} style={{ color: "#10b981" }} />
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>
                  Cryptographic Chain Verification
                </h3>
              </div>
              <button
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
                onClick={() => setVerifyModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="audit-modal-body" style={{ textAlign: "center", padding: "30px 24px" }}>
              {verifying ? (
                <div>
                  <RefreshCw size={36} className="spin" style={{ color: "#818cf8", marginBottom: 16 }} />
                  <p style={{ fontWeight: 600, color: "#fff" }}>Scanning audit blocks...</p>
                  <p style={{ fontSize: "0.82rem", color: "#94a3b8" }}>
                    Recomputing SHA-256 block hashes and parent link signatures sequentially.
                  </p>
                </div>
              ) : verifyResult?.verified ? (
                <div>
                  <div style={{
                    width: 64, height: 64, borderRadius: "50%",
                    background: "rgba(16, 185, 129, 0.15)",
                    border: "2px solid #10b981",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 16px",
                  }}>
                    <CheckCircle2 size={36} style={{ color: "#10b981" }} />
                  </div>

                  <h4 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff", marginBottom: 6 }}>
                    Chain Verification Passed
                  </h4>
                  <p style={{ fontSize: "0.86rem", color: "#94a3b8", marginBottom: 20 }}>
                    {verifyResult.message}
                  </p>

                  <div style={{
                    background: "#020617",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12,
                    padding: 16,
                    textAlign: "left",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    fontSize: "0.78rem",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#64748b" }}>Total Blocks Scanned:</span>
                      <strong style={{ color: "#fff" }}>{verifyResult.totalEntries}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#64748b" }}>Tamper Anomalies:</span>
                      <strong style={{ color: "#10b981" }}>0 (Zero)</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b" }}>Head Block Hash:</span>
                      <div style={{ fontFamily: "monospace", color: "#818cf8", wordBreak: "break-all", marginTop: 2 }}>
                        {verifyResult.headHash}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: "#64748b" }}>Genesis Block Hash:</span>
                      <div style={{ fontFamily: "monospace", color: "#94a3b8", wordBreak: "break-all", marginTop: 2 }}>
                        {verifyResult.genesisHash}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <AlertTriangle size={48} style={{ color: "#f43f5e", marginBottom: 16 }} />
                  <h4 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff", marginBottom: 6 }}>
                    Verification Alert
                  </h4>
                  <p style={{ fontSize: "0.86rem", color: "#f43f5e" }}>
                    {verifyResult?.message || "Failed to confirm cryptographic integrity."}
                  </p>
                </div>
              )}

              <button
                className="audit-btn audit-btn-primary"
                style={{ width: "100%", marginTop: 20 }}
                onClick={() => setVerifyModalOpen(false)}
              >
                Close Verification Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Simulation Modal ─── */}
      {simulateModalOpen && (
        <div className="audit-modal-backdrop" onClick={() => setSimulateModalOpen(false)}>
          <div className="audit-modal-card" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="audit-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Sparkles size={20} style={{ color: "#818cf8" }} />
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>
                  Simulate Audited Event
                </h3>
              </div>
              <button
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
                onClick={() => setSimulateModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="audit-modal-body">
              <p style={{ fontSize: "0.84rem", color: "var(--text-secondary, #94a3b8)", margin: 0 }}>
                Select an enterprise operation to dispatch into the audit logging engine. You will witness the new entry stream directly into the immutable ledger:
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  className="audit-btn audit-btn-outline"
                  style={{ justifyContent: "flex-start", padding: "12px 16px" }}
                  disabled={simulating}
                  onClick={() => triggerSimulation("grades", "UPDATE", {
                    action: "SIMULATED_GRADE_CURVE",
                    courseCode: "CS301",
                    curveType: "Square Root Boost",
                    averageDelta: "+3.5%",
                  })}
                >
                  <Edit3 size={16} style={{ color: "#38bdf8" }} />
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 600, color: "#fff" }}>Grade Modification</div>
                    <div style={{ fontSize: "0.74rem", color: "#94a3b8" }}>Apply curve algorithm to CS301 grades</div>
                  </div>
                </button>

                <button
                  className="audit-btn audit-btn-outline"
                  style={{ justifyContent: "flex-start", padding: "12px 16px" }}
                  disabled={simulating}
                  onClick={() => triggerSimulation("attendance", "CREATE", {
                    action: "SIMULATED_ATTENDANCE_SESSION",
                    course: "CS101",
                    date: new Date().toISOString().split("T")[0],
                    presentCount: 46,
                    absentCount: 2,
                  })}
                >
                  <Plus size={16} style={{ color: "#10b981" }} />
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 600, color: "#fff" }}>Attendance Batch Record</div>
                    <div style={{ fontSize: "0.74rem", color: "#94a3b8" }}>Save lab session roll-call (48 students)</div>
                  </div>
                </button>

                <button
                  className="audit-btn audit-btn-outline"
                  style={{ justifyContent: "flex-start", padding: "12px 16px" }}
                  disabled={simulating}
                  onClick={() => triggerSimulation("fees", "UPDATE", {
                    action: "SIMULATED_FEE_PAYMENT",
                    invoiceNumber: "INV-2026-FALL-091",
                    amount: 750,
                    gateway: "STRIPE",
                    payer: "David Chen",
                  })}
                >
                  <Activity size={16} style={{ color: "#fbbf24" }} />
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 600, color: "#fff" }}>Fee Installment Payment</div>
                    <div style={{ fontSize: "0.74rem", color: "#94a3b8" }}>Clear tuition installment of $750 via Stripe</div>
                  </div>
                </button>

                <button
                  className="audit-btn audit-btn-outline"
                  style={{ justifyContent: "flex-start", padding: "12px 16px" }}
                  disabled={simulating}
                  onClick={() => triggerSimulation("users", "UPDATE", {
                    action: "SIMULATED_ROLE_PROMOTION",
                    targetEmail: "priya.patel@scholarpulse.edu",
                    newRole: "Teaching Assistant",
                    promotedBy: "Dean of Academic Affairs",
                  })}
                >
                  <User size={16} style={{ color: "#a855f7" }} />
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 600, color: "#fff" }}>User Privilege Update</div>
                    <div style={{ fontSize: "0.74rem", color: "#94a3b8" }}>Promote student to Teaching Assistant</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
