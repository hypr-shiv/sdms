"use client";

import { useState, useEffect, useCallback } from "react";
import { type Role } from "@/lib/mockData";
import {
  Megaphone, Pin, Clock, Archive, Plus, Search,
  Eye, CheckCircle2, AlertTriangle, RefreshCw, Trash2,
  Calendar, Users, BookOpen, Layers, X, Edit3, Globe,
  ArrowUpRight, AlertOctagon, Check
} from "lucide-react";
import "../dashboard.css";
import "./announcements.css";

interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  authorId?: string;
  authorRole?: string;
  scope: "global" | "department" | "course" | "section";
  scopeLabel?: string;
  departmentId?: string;
  courseId?: string;
  sectionId?: string;
  priority: "low" | "normal" | "high" | "urgent";
  category: "general" | "academic" | "event" | "deadline" | "emergency";
  pinned: boolean;
  pinnedAt?: string;
  publishAt?: string;
  isScheduled?: boolean;
  archived: boolean;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
  isRead?: boolean;
  readCount?: number;
}

interface StatsSummary {
  active: number;
  pinned: number;
  scheduled: number;
  archived: number;
  unread: number;
}

interface ScopeOptions {
  departments: Array<{ id: string; code: string; name: string }>;
  courses: Array<{ id: string; code: string; name: string }>;
  sections: Array<{ id: string; name: string; courseId: string }>;
}

interface ReadReceiptItem {
  id: string;
  userName: string;
  userEmail: string;
  userRole: string;
  readAt: string;
}

interface ReceiptsData {
  announcementId: string;
  title: string;
  totalReads: number;
  audienceEstimate: number;
  readPercentage: number;
  receipts: ReadReceiptItem[];
}

export default function AnnouncementsPage() {
  const [user, setUser] = useState<{ id?: string; role: Role; name?: string; email?: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Data states
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [scopeOptions, setScopeOptions] = useState<ScopeOptions>({ departments: [], courses: [], sections: [] });
  const [loading, setLoading] = useState(true);

  // Filter states
  const [statusTab, setStatusTab] = useState<"active" | "pinned" | "scheduled" | "archived">("active");
  const [scopeFilter, setScopeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReceiptsModalOpen, setIsReceiptsModalOpen] = useState(false);
  const [receiptsData, setReceiptsData] = useState<ReceiptsData | null>(null);
  const [loadingReceipts, setLoadingReceipts] = useState(false);

  // Form State for New Announcement
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    scope: "global" as "global" | "department" | "course" | "section",
    departmentId: "",
    courseId: "",
    sectionId: "",
    priority: "normal" as "low" | "normal" | "high" | "urgent",
    category: "general" as "general" | "academic" | "event" | "deadline" | "emergency",
    pinned: false,
    isScheduled: false,
    publishAt: "",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Auth & Init
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("accessToken");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {}
    }
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const fetchScopeOptions = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:3001/announcements/scope-options", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setScopeOptions(await res.json());
      }
    } catch {}
  }, [token]);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:3001/announcements/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setStats(await res.json());
      }
    } catch {}
  }, [token]);

  const fetchAnnouncements = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusTab) params.append("status", statusTab);
      if (scopeFilter && scopeFilter !== "all") params.append("scope", scopeFilter);
      if (categoryFilter && categoryFilter !== "all") params.append("category", categoryFilter);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      const res = await fetch(`http://localhost:3001/announcements?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAnnouncements(await res.json());
      }
    } catch (err) {
      console.error("Failed to load announcements:", err);
    } finally {
      setLoading(false);
    }
  }, [token, statusTab, scopeFilter, categoryFilter, searchQuery]);

  useEffect(() => {
    if (token) {
      fetchAnnouncements();
      fetchStats();
      fetchScopeOptions();
    }
  }, [token, statusTab, scopeFilter, categoryFilter, fetchAnnouncements, fetchStats, fetchScopeOptions]);

  // Handler: Mark as Read
  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:3001/announcements/${id}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === id ? { ...a, isRead: true, readCount: (a.readCount || 0) + 1 } : a))
        );
        fetchStats();
        showToast("Announcement marked as read.", "success");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handler: Toggle Pin
  const handleTogglePin = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:3001/announcements/${id}/pin`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const updated = await res.json();
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === id ? { ...a, pinned: updated.pinned } : a))
        );
        fetchStats();
        showToast(updated.pinned ? "Announcement pinned to top!" : "Announcement unpinned.", "success");
      }
    } catch (err: any) {
      showToast("Failed to update pin: " + err.message, "error");
    }
  };

  // Handler: Archive or Restore
  const handleToggleArchive = async (id: string, currentlyArchived: boolean, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!token) return;
    const endpoint = currentlyArchived ? "restore" : "archive";
    try {
      const res = await fetch(`http://localhost:3001/announcements/${id}/${endpoint}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
        fetchStats();
        showToast(currentlyArchived ? "Announcement restored to active feed." : "Announcement archived.", "success");
      }
    } catch (err: any) {
      showToast("Archive update failed: " + err.message, "error");
    }
  };

  // Handler: Delete
  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("Are you sure you want to permanently delete this announcement? This action cannot be undone.")) {
      return;
    }
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:3001/announcements/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
        fetchStats();
        showToast("Announcement deleted successfully.", "success");
      }
    } catch (err: any) {
      showToast("Delete failed: " + err.message, "error");
    }
  };

  // Handler: Open Read Receipts
  const handleOpenReceipts = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!token) return;
    setIsReceiptsModalOpen(true);
    setLoadingReceipts(true);
    try {
      const res = await fetch(`http://localhost:3001/announcements/${id}/receipts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setReceiptsData(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReceipts(false);
    }
  };

  // Handler: Submit Create Announcement
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!formData.title.trim() || !formData.content.trim()) {
      showToast("Please provide both a title and message content.", "error");
      return;
    }

    setFormSubmitting(true);
    try {
      const payload: any = {
        title: formData.title,
        content: formData.content,
        scope: formData.scope,
        priority: formData.priority,
        category: formData.category,
        pinned: formData.pinned,
      };

      if (formData.scope === "department" && formData.departmentId) {
        payload.departmentId = formData.departmentId;
      } else if (formData.scope === "course" && formData.courseId) {
        payload.courseId = formData.courseId;
      } else if (formData.scope === "section" && formData.sectionId) {
        payload.sectionId = formData.sectionId;
      }

      if (formData.isScheduled && formData.publishAt) {
        payload.publishAt = new Date(formData.publishAt).toISOString();
      }

      const res = await fetch("http://localhost:3001/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to create announcement");
      }

      const created = await res.json();
      setIsCreateModalOpen(false);
      // Reset form
      setFormData({
        title: "",
        content: "",
        scope: "global",
        departmentId: "",
        courseId: "",
        sectionId: "",
        priority: "normal",
        category: "general",
        pinned: false,
        isScheduled: false,
        publishAt: "",
      });

      showToast(
        created.publishAt && new Date(created.publishAt) > new Date()
          ? "Announcement scheduled for future publication."
          : "Announcement published immediately!",
        "success"
      );
      fetchAnnouncements();
      fetchStats();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setFormSubmitting(false);
    }
  };

  const isStaff = user?.role === "admin" || user?.role === "teacher";
  const isAdmin = user?.role === "admin";

  const getScopeBadge = (scope: string, label?: string) => {
    switch (scope) {
      case "global":
        return <span className="announcements-badge" style={{ background: "rgba(168, 85, 247, 0.15)", color: "#c084fc", borderColor: "rgba(168, 85, 247, 0.3)" }}><Globe size={11} /> {label || "Campus Wide"}</span>;
      case "department":
        return <span className="announcements-badge" style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", borderColor: "rgba(56, 189, 248, 0.3)" }}><Layers size={11} /> {label || "Department"}</span>;
      case "course":
        return <span className="announcements-badge" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981", borderColor: "rgba(16, 185, 129, 0.3)" }}><BookOpen size={11} /> {label || "Course"}</span>;
      case "section":
        return <span className="announcements-badge" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24", borderColor: "rgba(245, 158, 11, 0.3)" }}><Users size={11} /> {label || "Section"}</span>;
      default:
        return <span className="announcements-badge">{label || scope}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === "urgent") {
      return <span className="announcements-badge announcements-badge-urgent"><AlertOctagon size={11} /> URGENT</span>;
    }
    if (priority === "high") {
      return <span className="announcements-badge" style={{ background: "rgba(249, 115, 22, 0.15)", color: "#fb923c", borderColor: "rgba(249, 115, 22, 0.3)" }}>HIGH PRIORITY</span>;
    }
    return null;
  };

  return (
    <div className="announcements-container">
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 24,
            right: 24,
            zIndex: 9999,
            padding: "12px 20px",
            borderRadius: 10,
            background: toast.type === "success" ? "#065f46" : toast.type === "error" ? "#7f1d1d" : "#1e1b4b",
            color: "#fff",
            border: `1px solid ${toast.type === "success" ? "#10b981" : toast.type === "error" ? "#ef4444" : "#6366f1"}`,
            boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
        >
          {toast.type === "success" && <CheckCircle2 size={16} />}
          {toast.type === "error" && <AlertTriangle size={16} />}
          {toast.type === "info" && <Megaphone size={16} />}
          {toast.message}
        </div>
      )}

      {/* Hero Header */}
      <section className="announcements-hero">
        <div>
          <div className="announcements-hero-title">
            <Megaphone size={28} color="#818cf8" />
            Campus Announcements & Notices
          </div>
          <div style={{ color: "var(--text-secondary, #94a3b8)", fontSize: "0.88rem", maxWidth: 650 }}>
            Unified communication center with multi-level scoping (Global, Department, Course, Section), priority alerting, scheduled dispatches, and reader receipt acknowledgement tracking.
          </div>
          <div className="announcements-hero-badges">
            <span className="announcements-badge announcements-badge-pinned">
              <Pin size={12} /> Pinned Highlights
            </span>
            <span className="announcements-badge announcements-badge-scheduled">
              <Clock size={12} /> Automated Scheduled Releases
            </span>
            <span className="announcements-badge">
              <Users size={12} /> Scoped Audience Delivery
            </span>
            <span className="announcements-badge" style={{ color: "#10b981" }}>
              <Eye size={12} /> Real-Time Read Receipts
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button
            className="announcement-action-btn"
            onClick={() => {
              fetchAnnouncements();
              fetchStats();
            }}
            title="Refresh announcements feed"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>

          {isStaff && (
            <button
              className="compliance-btn compliance-btn-primary"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus size={16} /> Post Announcement
            </button>
          )}
        </div>
      </section>

      {/* KPI Stats Overview */}
      <div className="announcements-stats-grid">
        <div
          className="announcements-stat-card"
          style={{ cursor: "pointer" }}
          onClick={() => setStatusTab("active")}
        >
          <div className="announcements-stat-header">
            <span className="announcements-stat-label">Active Notices</span>
            <div className="announcements-stat-icon" style={{ background: "rgba(99, 102, 241, 0.12)", color: "#818cf8" }}>
              <Megaphone size={18} />
            </div>
          </div>
          <div className="announcements-stat-val">{stats ? stats.active : "—"}</div>
          <div style={{ fontSize: "0.74rem", color: "var(--text-secondary, #94a3b8)" }}>
            Published & accessible
          </div>
        </div>

        <div
          className="announcements-stat-card"
          style={{ cursor: "pointer" }}
          onClick={() => setStatusTab("pinned")}
        >
          <div className="announcements-stat-header">
            <span className="announcements-stat-label">Pinned Priority</span>
            <div className="announcements-stat-icon" style={{ background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}>
              <Pin size={18} />
            </div>
          </div>
          <div className="announcements-stat-val" style={{ color: "#fbbf24" }}>
            {stats ? stats.pinned : 0}
          </div>
          <div style={{ fontSize: "0.74rem", color: "var(--text-secondary, #94a3b8)" }}>
            Elevated feed notices
          </div>
        </div>

        <div
          className="announcements-stat-card"
          style={{ cursor: "pointer" }}
          onClick={() => setStatusTab("scheduled")}
        >
          <div className="announcements-stat-header">
            <span className="announcements-stat-label">Scheduled Future</span>
            <div className="announcements-stat-icon" style={{ background: "rgba(56, 189, 248, 0.12)", color: "#38bdf8" }}>
              <Clock size={18} />
            </div>
          </div>
          <div className="announcements-stat-val" style={{ color: "#38bdf8" }}>
            {stats ? stats.scheduled : 0}
          </div>
          <div style={{ fontSize: "0.74rem", color: "var(--text-secondary, #94a3b8)" }}>
            Pending publication date
          </div>
        </div>

        <div
          className="announcements-stat-card"
          style={{ cursor: "pointer" }}
          onClick={() => setStatusTab("archived")}
        >
          <div className="announcements-stat-header">
            <span className="announcements-stat-label">Archived Repository</span>
            <div className="announcements-stat-icon" style={{ background: "rgba(148, 163, 184, 0.12)", color: "#94a3b8" }}>
              <Archive size={18} />
            </div>
          </div>
          <div className="announcements-stat-val">{stats ? stats.archived : 0}</div>
          <div style={{ fontSize: "0.74rem", color: "var(--text-secondary, #94a3b8)" }}>
            Past records & archives
          </div>
        </div>

        <div className="announcements-stat-card">
          <div className="announcements-stat-header">
            <span className="announcements-stat-label">Your Unread</span>
            <div className="announcements-stat-icon" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
              <Eye size={18} />
            </div>
          </div>
          <div className="announcements-stat-val" style={{ color: stats && stats.unread > 0 ? "#818cf8" : "#10b981" }}>
            {stats ? stats.unread : 0}
          </div>
          <div style={{ fontSize: "0.74rem", color: "var(--text-secondary, #94a3b8)" }}>
            Pending your acknowledgement
          </div>
        </div>
      </div>

      {/* Filter & Controls Bar */}
      <div className="announcements-controls-bar">
        <div className="announcements-top-controls">
          {/* Status Tabs */}
          <div className="announcements-status-tabs">
            <button
              className={`status-tab-btn ${statusTab === "active" ? "active" : ""}`}
              onClick={() => setStatusTab("active")}
            >
              <Megaphone size={14} /> Active Feed
              {stats && <span className="status-badge-count">{stats.active}</span>}
            </button>
            <button
              className={`status-tab-btn ${statusTab === "pinned" ? "active" : ""}`}
              onClick={() => setStatusTab("pinned")}
            >
              <Pin size={14} /> Pinned
              {stats && stats.pinned > 0 && <span className="status-badge-count">{stats.pinned}</span>}
            </button>
            <button
              className={`status-tab-btn ${statusTab === "scheduled" ? "active" : ""}`}
              onClick={() => setStatusTab("scheduled")}
            >
              <Clock size={14} /> Scheduled
              {stats && stats.scheduled > 0 && <span className="status-badge-count">{stats.scheduled}</span>}
            </button>
            <button
              className={`status-tab-btn ${statusTab === "archived" ? "active" : ""}`}
              onClick={() => setStatusTab("archived")}
            >
              <Archive size={14} /> Archived
              {stats && stats.archived > 0 && <span className="status-badge-count">{stats.archived}</span>}
            </button>
          </div>

          {/* Search Box */}
          <div className="announcements-search-box">
            <Search size={15} className="announcements-search-icon" />
            <input
              type="text"
              className="announcements-search-input"
              placeholder="Search announcements by title, keyword, or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Scope and Category Filters */}
        <div className="announcements-search-row">
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.74rem", color: "var(--text-tertiary, #94a3b8)", fontWeight: 700, textTransform: "uppercase" }}>
              Scope:
            </span>
            <button
              className={`scope-pill-btn ${scopeFilter === "all" ? "active" : ""}`}
              onClick={() => setScopeFilter("all")}
            >
              All Scopes
            </button>
            <button
              className={`scope-pill-btn ${scopeFilter === "global" ? "active" : ""}`}
              onClick={() => setScopeFilter("global")}
            >
              <Globe size={13} /> Global
            </button>
            <button
              className={`scope-pill-btn ${scopeFilter === "department" ? "active" : ""}`}
              onClick={() => setScopeFilter("department")}
            >
              <Layers size={13} /> Department
            </button>
            <button
              className={`scope-pill-btn ${scopeFilter === "course" ? "active" : ""}`}
              onClick={() => setScopeFilter("course")}
            >
              <BookOpen size={13} /> Courses
            </button>
            <button
              className={`scope-pill-btn ${scopeFilter === "section" ? "active" : ""}`}
              onClick={() => setScopeFilter("section")}
            >
              <Users size={13} /> Sections
            </button>
          </div>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "0.74rem", color: "var(--text-tertiary, #94a3b8)", fontWeight: 700, textTransform: "uppercase" }}>
              Category:
            </span>
            <select
              className="form-select"
              style={{ padding: "6px 10px", fontSize: "0.78rem" }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="general">General</option>
              <option value="academic">Academic</option>
              <option value="event">Event</option>
              <option value="deadline">Deadline</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>
        </div>
      </div>

      {/* Announcements Feed List */}
      <div className="announcements-feed">
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-tertiary, #94a3b8)" }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px" }} />
            <div>Loading campus dispatches and announcements...</div>
          </div>
        ) : announcements.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "rgba(255,255,255,0.02)", borderRadius: 14, border: "1px dashed rgba(255,255,255,0.1)" }}>
            <Megaphone size={36} color="#6366f1" style={{ margin: "0 auto 12px", opacity: 0.7 }} />
            <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#fff", marginBottom: 6 }}>
              No announcements found
            </div>
            <div style={{ fontSize: "0.84rem", color: "var(--text-secondary, #94a3b8)", maxWidth: 400, margin: "0 auto" }}>
              {statusTab === "scheduled"
                ? "No upcoming scheduled releases at this time."
                : statusTab === "archived"
                ? "Archive repository is currently empty."
                : "There are currently no active announcements matching your selected filters."}
            </div>
          </div>
        ) : (
          announcements.map((ann) => {
            const isUnread = !ann.isRead;
            const canManage = isAdmin || (user && ann.authorId === user.id);

            return (
              <article
                key={ann.id}
                className={`announcement-card ${ann.pinned ? "is-pinned" : ""} ${isUnread ? "is-unread" : ""}`}
              >
                {/* Header */}
                <div className="announcement-card-header">
                  <div className="announcement-title-row">
                    {ann.pinned && (
                      <span className="announcements-badge announcements-badge-pinned">
                        <Pin size={11} /> PINNED
                      </span>
                    )}

                    {getPriorityBadge(ann.priority)}
                    {getScopeBadge(ann.scope, ann.scopeLabel)}

                    <span className="announcements-badge" style={{ textTransform: "uppercase" }}>
                      {ann.category}
                    </span>

                    {ann.isScheduled && (
                      <span className="announcements-badge announcements-badge-scheduled">
                        <Clock size={11} /> Releases {new Date(ann.publishAt || "").toLocaleDateString()}
                      </span>
                    )}

                    {ann.archived && (
                      <span className="announcements-badge" style={{ borderColor: "#ef4444", color: "#ef4444" }}>
                        <Archive size={11} /> ARCHIVED
                      </span>
                    )}
                  </div>

                  {/* Read Receipts Count Button */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {canManage ? (
                      <button
                        className="read-receipts-indicator"
                        onClick={(e) => handleOpenReceipts(ann.id, e)}
                        title="View users who have read this announcement"
                      >
                        <Eye size={12} /> {ann.readCount || 0} read
                      </button>
                    ) : (
                      <span style={{ fontSize: "0.74rem", color: "var(--text-tertiary, #94a3b8)" }}>
                        {ann.readCount || 0} readers
                      </span>
                    )}

                    {isUnread && (
                      <button
                        className="announcement-action-btn"
                        style={{ background: "rgba(99, 102, 241, 0.15)", color: "#a5b4fc", borderColor: "rgba(99, 102, 241, 0.3)" }}
                        onClick={(e) => handleMarkAsRead(ann.id, e)}
                        title="Mark as read"
                      >
                        <Check size={12} /> Mark Read
                      </button>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h2 className="announcement-title">{ann.title}</h2>

                {/* Content */}
                <div className="announcement-content">{ann.content}</div>

                {/* Footer Metadata & Actions */}
                <div className="announcement-meta-row">
                  <div className="announcement-author-info">
                    <div className="announcement-author-avatar">
                      {ann.author
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: "#fff" }}>{ann.author}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary, #94a3b8)" }}>
                        {ann.authorRole ? ann.authorRole.toUpperCase() : "STAFF"} • Posted {new Date(ann.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    </div>
                  </div>

                  {/* Management Actions */}
                  {canManage && (
                    <div className="announcement-actions">
                      <button
                        className={`announcement-action-btn ${ann.pinned ? "active" : ""}`}
                        onClick={(e) => handleTogglePin(ann.id, e)}
                        title={ann.pinned ? "Unpin announcement" : "Pin announcement to top"}
                      >
                        <Pin size={12} /> {ann.pinned ? "Unpin" : "Pin"}
                      </button>

                      <button
                        className="announcement-action-btn"
                        onClick={(e) => handleToggleArchive(ann.id, ann.archived, e)}
                        title={ann.archived ? "Restore to active feed" : "Move to archive"}
                      >
                        <Archive size={12} /> {ann.archived ? "Restore" : "Archive"}
                      </button>

                      <button
                        className="announcement-action-btn"
                        style={{ color: "#ef4444" }}
                        onClick={(e) => handleDelete(ann.id, e)}
                        title="Delete announcement permanently"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* MODAL 1: Create / Schedule Announcement */}
      {isCreateModalOpen && (
        <div className="announcement-modal-overlay">
          <div className="announcement-modal">
            <div className="announcement-modal-header">
              <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 10 }}>
                <Megaphone size={20} color="#818cf8" /> New Scoped Announcement
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement}>
              <div className="announcement-modal-body">
                <div className="form-field">
                  <label className="form-label">Announcement Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Midterm Examination Schedule & Room Allocations"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div className="form-field">
                    <label className="form-label">Delivery Scope *</label>
                    <select
                      className="form-select"
                      value={formData.scope}
                      onChange={(e) => setFormData({ ...formData, scope: e.target.value as any })}
                    >
                      <option value="global">🌐 Global (Campus Wide)</option>
                      <option value="department">🏛️ Department Specific</option>
                      <option value="course">📚 Specific Course</option>
                      <option value="section">🏷️ Course Section</option>
                    </select>
                  </div>

                  {/* Dynamic Target Selection */}
                  {formData.scope === "department" && (
                    <div className="form-field">
                      <label className="form-label">Select Department *</label>
                      <select
                        className="form-select"
                        value={formData.departmentId}
                        onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                        required
                      >
                        <option value="">Choose department...</option>
                        {scopeOptions.departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.code} - {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formData.scope === "course" && (
                    <div className="form-field">
                      <label className="form-label">Select Course *</label>
                      <select
                        className="form-select"
                        value={formData.courseId}
                        onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                        required
                      >
                        <option value="">Choose course...</option>
                        {scopeOptions.courses.map((crs) => (
                          <option key={crs.id} value={crs.id}>
                            {crs.code} - {crs.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formData.scope === "section" && (
                    <div className="form-field">
                      <label className="form-label">Select Section *</label>
                      <select
                        className="form-select"
                        value={formData.sectionId}
                        onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                        required
                      >
                        <option value="">Choose section...</option>
                        {scopeOptions.sections.map((sec) => (
                          <option key={sec.id} value={sec.id}>
                            {sec.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formData.scope === "global" && (
                    <div className="form-field">
                      <label className="form-label">Target Audience</label>
                      <input
                        type="text"
                        className="form-input"
                        value="All Students, Faculty, & Staff"
                        disabled
                      />
                    </div>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div className="form-field">
                    <label className="form-label">Priority Level</label>
                    <select
                      className="form-select"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    >
                      <option value="normal">Normal</option>
                      <option value="high">High Priority</option>
                      <option value="urgent">Urgent / Emergency Alert</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    >
                      <option value="general">General</option>
                      <option value="academic">Academic</option>
                      <option value="event">Event</option>
                      <option value="deadline">Deadline</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label">Announcement Content *</label>
                  <textarea
                    rows={6}
                    className="form-textarea"
                    placeholder="Enter detailed notice, instructions, links, or requirements..."
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    required
                  />
                </div>

                {/* Scheduling & Pinning Controls */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12, background: "rgba(255,255,255,0.02)", padding: 14, borderRadius: 10, border: "1px solid var(--border-primary, rgba(255,255,255,0.08))" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#fff" }}>
                        📌 Pin Announcement to Top
                      </div>
                      <div style={{ fontSize: "0.74rem", color: "var(--text-tertiary, #94a3b8)" }}>
                        Keeps notice highlighted at the very top of the student feed
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={formData.pinned}
                        onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: formData.isScheduled ? 10 : 0 }}>
                      <div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#fff" }}>
                          ⏳ Schedule for Future Release
                        </div>
                        <div style={{ fontSize: "0.74rem", color: "var(--text-tertiary, #94a3b8)" }}>
                          Withholds publication from students until the specified release time
                        </div>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={formData.isScheduled}
                          onChange={(e) => setFormData({ ...formData, isScheduled: e.target.checked })}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    {formData.isScheduled && (
                      <div className="form-field" style={{ marginTop: 8 }}>
                        <label className="form-label">Scheduled Publication Date & Time *</label>
                        <input
                          type="datetime-local"
                          className="form-input"
                          value={formData.publishAt}
                          onChange={(e) => setFormData({ ...formData, publishAt: e.target.value })}
                          required={formData.isScheduled}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="announcement-modal-footer">
                <button
                  type="button"
                  className="compliance-btn compliance-btn-outline"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="compliance-btn compliance-btn-primary"
                  disabled={formSubmitting}
                >
                  {formSubmitting
                    ? "Publishing..."
                    : formData.isScheduled
                    ? "Schedule Announcement"
                    : "Publish Announcement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Read Receipts Inspector */}
      {isReceiptsModalOpen && (
        <div className="announcement-modal-overlay">
          <div className="announcement-modal">
            <div className="announcement-modal-header">
              <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 10 }}>
                <Eye size={20} color="#10b981" /> Read Receipts Acknowledgements
              </div>
              <button
                onClick={() => setIsReceiptsModalOpen(false)}
                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="announcement-modal-body">
              {loadingReceipts ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-tertiary, #94a3b8)" }}>
                  <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 8px" }} />
                  <div>Retrieving reader access logs...</div>
                </div>
              ) : receiptsData ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>
                      {receiptsData.title}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
                      <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "#10b981" }}>
                        {receiptsData.totalReads} / {receiptsData.audienceEstimate} read
                      </span>
                      <span className="announcements-badge" style={{ color: "#10b981", borderColor: "rgba(16, 185, 129, 0.3)" }}>
                        {receiptsData.readPercentage}% Reach
                      </span>
                    </div>

                    <div style={{ height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden", marginTop: 8 }}>
                      <div style={{ height: "100%", width: `${receiptsData.readPercentage}%`, background: "#10b981" }} />
                    </div>
                  </div>

                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#cbd5e1" }}>
                    Individual Reader Ledger ({receiptsData.receipts.length} entries)
                  </div>

                  {receiptsData.receipts.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "24px 10px", color: "var(--text-tertiary, #94a3b8)", fontSize: "0.82rem" }}>
                      No readers have opened this announcement yet.
                    </div>
                  ) : (
                    <div className="compliance-table-container" style={{ maxHeight: 300, overflowY: "auto" }}>
                      <table className="compliance-table">
                        <thead>
                          <tr>
                            <th>User</th>
                            <th>Role</th>
                            <th>Read Timestamp</th>
                          </tr>
                        </thead>
                        <tbody>
                          {receiptsData.receipts.map((r) => (
                            <tr key={r.id}>
                              <td>
                                <div style={{ fontWeight: 600, color: "#fff" }}>{r.userName}</div>
                                <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary, #94a3b8)" }}>{r.userEmail}</div>
                              </td>
                              <td>
                                <span className="announcements-badge">{r.userRole}</span>
                              </td>
                              <td style={{ fontSize: "0.78rem" }}>
                                {new Date(r.readAt).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="announcement-modal-footer">
              <button
                className="compliance-btn compliance-btn-outline"
                onClick={() => setIsReceiptsModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
