"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  BookOpen, FileText, Presentation, BookMarked, FlaskConical,
  ClipboardList, FileQuestion, Upload, Download, Search, Filter,
  Eye, EyeOff, History, RefreshCw, Trash2, Edit2, X, Check,
  Brain, Sparkles, AlertCircle, Clock, ChevronDown, File,
  FolderOpen, Layers, ArrowUpCircle, BarChart3, Database
} from "lucide-react";
import "../dashboard.css";
import "./resources.css";

const API = "http://localhost:3001";

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function authJsonHeaders() {
  return {
    "Content-Type": "application/json",
    ...authHeaders(),
  };
}

// ─── Types ───

interface ResourceItem {
  id: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  title: string;
  description?: string;
  resourceType: string;
  status: string;
  fileName: string;
  originalName: string;
  fileUrl: string;
  mimeType?: string;
  fileSizeKB: number;
  uploadedById: string;
  uploadedByName: string;
  uploadedByRole?: string;
  version: number;
  previousVersionId?: string;
  changeNotes?: string;
  ragIndexStatus: string;
  ragIndexedAt?: string;
  ragChunkCount?: number;
  isVisibleToStudents: boolean;
  semesterCode?: string;
  tags?: string;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ResourceStats {
  total: number;
  byType: { type: string; count: string }[];
  ragStatus: { indexed: number; pending: number; failed: number };
  totalDownloads: number;
}

interface CourseItem {
  id: string;
  code: string;
  name: string;
}

// ─── Helpers ───

const RESOURCE_TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  syllabus: { label: "Syllabus", icon: BookOpen, color: "#d946ef" },
  lecture_notes: { label: "Lecture Notes", icon: FileText, color: "#3b82f6" },
  slides: { label: "Slides", icon: Presentation, color: "#f97316" },
  reference: { label: "Reference", icon: BookMarked, color: "#22c55e" },
  lab_manual: { label: "Lab Manual", icon: FlaskConical, color: "#ef4444" },
  worksheet: { label: "Worksheet", icon: ClipboardList, color: "#eab308" },
  other: { label: "Other", icon: FileQuestion, color: "#8b5cf6" },
};

const RAG_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  indexed: { label: "AI Indexed", className: "rag-indexed" },
  pending: { label: "Pending Index", className: "rag-pending" },
  indexing: { label: "Indexing...", className: "rag-indexing" },
  failed: { label: "Index Failed", className: "rag-failed" },
  not_applicable: { label: "N/A", className: "" },
};

function formatFileSize(kb: number): string {
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb} KB`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Main Page ───

export default function ResourcesPage() {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [stats, setStats] = useState<ResourceStats | null>(null);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("student");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"library" | "syllabus" | "rag">("library");

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState<ResourceItem | null>(null);
  const [versionHistory, setVersionHistory] = useState<ResourceItem[]>([]);

  // Load user role
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const user = JSON.parse(stored);
        setUserRole(user.role || "student");
      }
    } catch {}
  }, []);

  // Fetch data
  const fetchResources = useCallback(async () => {
    try {
      const res = await fetch(`${API}/resources`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setResources(data);
      }
    } catch {}
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API}/resources/stats`, { headers: authHeaders() });
      if (res.ok) setStats(await res.json());
    } catch {}
  }, []);

  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch(`${API}/courses`, { headers: authJsonHeaders() });
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch {}
  }, []);

  useEffect(() => {
    Promise.all([fetchResources(), fetchStats(), fetchCourses()]).finally(() => setLoading(false));
  }, [fetchResources, fetchStats, fetchCourses]);

  // Filtering
  const filtered = useMemo(() => {
    let list = resources;
    if (activeTab === "syllabus") {
      list = list.filter(r => r.resourceType === "syllabus");
    }
    if (selectedType !== "all") {
      list = list.filter(r => r.resourceType === selectedType);
    }
    if (selectedCourse !== "all") {
      list = list.filter(r => r.courseCode === selectedCourse);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.courseCode.toLowerCase().includes(q) ||
        r.tags?.toLowerCase().includes(q)
      );
    }
    // Filter out archived for non-admins
    if (userRole !== "admin" && userRole !== "teacher") {
      list = list.filter(r => r.status !== "archived");
    }
    return list;
  }, [resources, activeTab, selectedType, selectedCourse, searchQuery, userRole]);

  // Version history
  const openVersionHistory = useCallback(async (resource: ResourceItem) => {
    setShowVersionModal(resource);
    try {
      const res = await fetch(`${API}/resources/${resource.id}/versions`, { headers: authHeaders() });
      if (res.ok) setVersionHistory(await res.json());
    } catch {}
  }, []);

  // Download tracking
  const handleDownload = useCallback(async (resource: ResourceItem) => {
    try {
      await fetch(`${API}/resources/${resource.id}/download`, { method: "POST", headers: authHeaders() });
      // Open file in new tab
      window.open(`${API}${resource.fileUrl}`, "_blank");
      fetchResources();
    } catch {}
  }, [fetchResources]);

  // RAG re-index
  const handleReindex = useCallback(async (id: string) => {
    try {
      await fetch(`${API}/resources/${id}/reindex`, { method: "POST", headers: authHeaders() });
      fetchResources();
    } catch {}
  }, [fetchResources]);

  // Delete
  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;
    try {
      await fetch(`${API}/resources/${id}`, { method: "DELETE", headers: authJsonHeaders() });
      fetchResources();
      fetchStats();
    } catch {}
  }, [fetchResources, fetchStats]);

  // Toggle visibility
  const handleToggleVisibility = useCallback(async (resource: ResourceItem) => {
    try {
      await fetch(`${API}/resources/${resource.id}`, {
        method: "PUT",
        headers: authJsonHeaders(),
        body: JSON.stringify({ isVisibleToStudents: !resource.isVisibleToStudents }),
      });
      fetchResources();
    } catch {}
  }, [fetchResources]);

  const isFaculty = userRole === "teacher" || userRole === "admin";

  const uniqueCourses = useMemo(() => {
    const codes = new Set(resources.map(r => r.courseCode));
    return Array.from(codes).sort();
  }, [resources]);

  if (loading) {
    return (
      <div className="resources-page" style={{ padding: 40, textAlign: "center" }}>
        <RefreshCw size={32} style={{ animation: "spin 1s linear infinite", opacity: 0.3 }} />
        <p style={{ marginTop: 12, color: "var(--text-secondary)" }}>Loading Resource Library...</p>
      </div>
    );
  }

  return (
    <div className="resources-page">
      {/* ─── Hero Banner ─── */}
      <div className="resources-hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1>📚 Syllabus & Resource Library</h1>
            <p>Course materials, lecture notes, slides, and reference documents — all in one place</p>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-value">{stats?.total || resources.length}</div>
              <div className="hero-stat-label">Resources</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">{stats?.ragStatus.indexed || 0}</div>
              <div className="hero-stat-label">AI Indexed</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">{stats?.totalDownloads || 0}</div>
              <div className="hero-stat-label">Downloads</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <div className="resources-tabs">
        <button
          className={`resources-tab ${activeTab === "library" ? "active" : ""}`}
          onClick={() => setActiveTab("library")}
        >
          <FolderOpen size={16} />
          Resource Library
          <span className="tab-badge">{resources.filter(r => r.status !== "archived").length}</span>
        </button>
        <button
          className={`resources-tab ${activeTab === "syllabus" ? "active" : ""}`}
          onClick={() => setActiveTab("syllabus")}
        >
          <BookOpen size={16} />
          Course Syllabi
          <span className="tab-badge">{resources.filter(r => r.resourceType === "syllabus" && r.status !== "archived").length}</span>
        </button>
        <button
          className={`resources-tab ${activeTab === "rag" ? "active" : ""}`}
          onClick={() => setActiveTab("rag")}
        >
          <Brain size={16} />
          AI Knowledge Base
        </button>
      </div>

      {/* ─── RAG Knowledge Base Tab ─── */}
      {activeTab === "rag" && (
        <div style={{ marginBottom: 28 }}>
          <RagDashboard
            resources={resources}
            stats={stats}
            onReindex={handleReindex}
            isFaculty={isFaculty}
          />
        </div>
      )}

      {/* ─── Toolbar ─── */}
      {activeTab !== "rag" && (
        <>
          <div className="resources-toolbar">
            <div className="resources-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search resources, courses, tags..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {activeTab === "library" && (
              <>
                <select
                  className="filter-chip"
                  value={selectedType}
                  onChange={e => setSelectedType(e.target.value)}
                  style={{ background: selectedType !== "all" ? "#6366f1" : undefined, color: selectedType !== "all" ? "#fff" : undefined }}
                >
                  <option value="all">All Types</option>
                  {Object.entries(RESOURCE_TYPE_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>

                <select
                  className="filter-chip"
                  value={selectedCourse}
                  onChange={e => setSelectedCourse(e.target.value)}
                  style={{ background: selectedCourse !== "all" ? "#6366f1" : undefined, color: selectedCourse !== "all" ? "#fff" : undefined }}
                >
                  <option value="all">All Courses</option>
                  {uniqueCourses.map(code => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </select>
              </>
            )}

            {isFaculty && (
              <button className="upload-btn" onClick={() => setShowUploadModal(true)}>
                <Upload size={16} />
                Upload Resource
              </button>
            )}
          </div>

          {/* ─── Resource Grid ─── */}
          {filtered.length === 0 ? (
            <div className="resources-empty">
              <FolderOpen />
              <h3>No resources found</h3>
              <p>
                {searchQuery
                  ? "Try adjusting your search or filters"
                  : isFaculty
                    ? "Upload your first course material to get started"
                    : "No materials have been uploaded for your courses yet"
                }
              </p>
            </div>
          ) : (
            <div className="resources-grid">
              {filtered.map(resource => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  isFaculty={isFaculty}
                  onDownload={handleDownload}
                  onDelete={handleDelete}
                  onVersionHistory={openVersionHistory}
                  onReindex={handleReindex}
                  onToggleVisibility={handleToggleVisibility}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ─── Upload Modal ─── */}
      {showUploadModal && (
        <UploadModal
          courses={courses}
          onClose={() => setShowUploadModal(false)}
          onUpload={() => {
            fetchResources();
            fetchStats();
            setShowUploadModal(false);
          }}
        />
      )}

      {/* ─── Version History Modal ─── */}
      {showVersionModal && (
        <VersionHistoryModal
          resource={showVersionModal}
          versions={versionHistory}
          onClose={() => { setShowVersionModal(null); setVersionHistory([]); }}
          isFaculty={isFaculty}
          onUploadNewVersion={() => {
            fetchResources();
            fetchStats();
            setShowVersionModal(null);
            setVersionHistory([]);
          }}
        />
      )}
    </div>
  );
}

// ─── Resource Card Component ───

function ResourceCard({
  resource, isFaculty, onDownload, onDelete, onVersionHistory, onReindex, onToggleVisibility,
}: {
  resource: ResourceItem;
  isFaculty: boolean;
  onDownload: (r: ResourceItem) => void;
  onDelete: (id: string) => void;
  onVersionHistory: (r: ResourceItem) => void;
  onReindex: (id: string) => void;
  onToggleVisibility: (r: ResourceItem) => void;
}) {
  const typeConfig = RESOURCE_TYPE_CONFIG[resource.resourceType] || RESOURCE_TYPE_CONFIG.other;
  const ragConfig = RAG_STATUS_CONFIG[resource.ragIndexStatus] || RAG_STATUS_CONFIG.pending;
  const TypeIcon = typeConfig.icon;

  return (
    <div className="resource-card">
      <div className="resource-card-header">
        <div className={`resource-type-icon ${resource.resourceType}`}>
          <TypeIcon size={22} />
        </div>
        <div className="resource-card-info">
          <h3 className="resource-card-title">{resource.title}</h3>
          <span className="resource-card-course">{resource.courseCode} • {resource.courseName}</span>
        </div>
      </div>

      {resource.description && (
        <p className="resource-card-desc">{resource.description}</p>
      )}

      <div className="resource-card-meta">
        <span className="resource-meta-chip">
          <File size={12} />
          {formatFileSize(resource.fileSizeKB)}
        </span>
        <span className="resource-meta-chip version">
          <Layers size={12} />
          v{resource.version}
        </span>
        <span className={`resource-meta-chip ${ragConfig.className}`}>
          {resource.ragIndexStatus === "indexed" ? <Sparkles size={12} /> :
           resource.ragIndexStatus === "indexing" ? <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> :
           resource.ragIndexStatus === "failed" ? <AlertCircle size={12} /> :
           <Clock size={12} />
          }
          {ragConfig.label}
        </span>
        {resource.status === "draft" && (
          <span className="resource-meta-chip draft">Draft</span>
        )}
        {!resource.isVisibleToStudents && isFaculty && (
          <span className="resource-meta-chip" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
            <EyeOff size={12} />
            Hidden
          </span>
        )}
        <span className="resource-meta-chip">
          <Download size={12} />
          {resource.downloadCount}
        </span>
      </div>

      <div className="resource-card-footer">
        <div className="resource-uploader">
          <div className="resource-uploader-avatar">
            {getInitials(resource.uploadedByName)}
          </div>
          <span>{resource.uploadedByName} • {formatDate(resource.updatedAt)}</span>
        </div>

        <div className="resource-card-actions">
          <button
            className="resource-action-btn"
            title="Download"
            onClick={() => onDownload(resource)}
          >
            <Download size={14} />
          </button>

          {resource.version > 1 && (
            <button
              className="resource-action-btn"
              title="Version History"
              onClick={() => onVersionHistory(resource)}
            >
              <History size={14} />
            </button>
          )}

          {isFaculty && resource.ragIndexStatus === "failed" && (
            <button
              className="resource-action-btn"
              title="Retry AI Indexing"
              onClick={() => onReindex(resource.id)}
            >
              <RefreshCw size={14} />
            </button>
          )}

          {isFaculty && (
            <button
              className="resource-action-btn"
              title={resource.isVisibleToStudents ? "Hide from Students" : "Show to Students"}
              onClick={() => onToggleVisibility(resource)}
            >
              {resource.isVisibleToStudents ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
          )}

          {isFaculty && (
            <button
              className="resource-action-btn"
              title="Upload New Version"
              onClick={() => onVersionHistory(resource)}
            >
              <ArrowUpCircle size={14} />
            </button>
          )}

          {isFaculty && (
            <button
              className="resource-action-btn danger"
              title="Delete"
              onClick={() => onDelete(resource.id)}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── RAG Dashboard ───

function RagDashboard({
  resources, stats, onReindex, isFaculty,
}: {
  resources: ResourceItem[];
  stats: ResourceStats | null;
  onReindex: (id: string) => void;
  isFaculty: boolean;
}) {
  const indexed = resources.filter(r => r.ragIndexStatus === "indexed");
  const pending = resources.filter(r => r.ragIndexStatus === "pending" || r.ragIndexStatus === "indexing");
  const failed = resources.filter(r => r.ragIndexStatus === "failed");

  const totalChunks = indexed.reduce((sum, r) => sum + (r.ragChunkCount || 0), 0);

  return (
    <div>
      {/* RAG Overview Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div className="resource-card" style={{ padding: 20, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, #86efac, #22c55e)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Database size={24} color="#fff" />
            </div>
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--text-primary)" }}>{indexed.length}</div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 2 }}>Documents Indexed</div>
        </div>

        <div className="resource-card" style={{ padding: 20, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, #c4b5fd, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={24} color="#fff" />
            </div>
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--text-primary)" }}>{totalChunks}</div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 2 }}>Knowledge Chunks</div>
        </div>

        <div className="resource-card" style={{ padding: 20, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, #fde68a, #eab308)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Clock size={24} color="#fff" />
            </div>
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--text-primary)" }}>{pending.length}</div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 2 }}>Pending Indexing</div>
        </div>

        <div className="resource-card" style={{ padding: 20, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, #fca5a5, #ef4444)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AlertCircle size={24} color="#fff" />
            </div>
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--text-primary)" }}>{failed.length}</div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 2 }}>Failed</div>
        </div>
      </div>

      {/* Indexed Documents List */}
      <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 14, color: "var(--text-primary)" }}>
        <Brain size={18} style={{ marginRight: 8, verticalAlign: "middle" }} />
        Indexed Documents in AI Knowledge Base
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {indexed.map(r => (
          <div key={r.id} className="resource-card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
            <div className={`resource-type-icon ${r.resourceType}`} style={{ width: 36, height: 36 }}>
              {(() => {
                const Icon = (RESOURCE_TYPE_CONFIG[r.resourceType] || RESOURCE_TYPE_CONFIG.other).icon;
                return <Icon size={18} />;
              })()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {r.title}
              </div>
              <div style={{ fontSize: "0.76rem", color: "var(--text-secondary)" }}>
                {r.courseCode} • {r.ragChunkCount} chunks • Indexed {r.ragIndexedAt ? formatDate(r.ragIndexedAt) : "recently"}
              </div>
            </div>
            <span className="rag-badge indexed">
              <Sparkles size={12} />
              Indexed
            </span>
          </div>
        ))}

        {failed.length > 0 && (
          <>
            <h4 style={{ fontSize: "0.88rem", fontWeight: 600, margin: "12px 0 6px", color: "#ef4444" }}>
              <AlertCircle size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />
              Failed Documents
            </h4>
            {failed.map(r => (
              <div key={r.id} className="resource-card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, borderColor: "rgba(239,68,68,0.2)" }}>
                <div className={`resource-type-icon ${r.resourceType}`} style={{ width: 36, height: 36 }}>
                  {(() => {
                    const Icon = (RESOURCE_TYPE_CONFIG[r.resourceType] || RESOURCE_TYPE_CONFIG.other).icon;
                    return <Icon size={18} />;
                  })()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)" }}>{r.title}</div>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-secondary)" }}>{r.courseCode}</div>
                </div>
                {isFaculty && (
                  <button className="btn-secondary" style={{ fontSize: "0.78rem", padding: "6px 14px" }} onClick={() => onReindex(r.id)}>
                    <RefreshCw size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />
                    Retry
                  </button>
                )}
                <span className="rag-badge failed">
                  <AlertCircle size={12} />
                  Failed
                </span>
              </div>
            ))}
          </>
        )}

        {pending.length > 0 && (
          <>
            <h4 style={{ fontSize: "0.88rem", fontWeight: 600, margin: "12px 0 6px", color: "#ca8a04" }}>
              <Clock size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />
              Pending Indexing
            </h4>
            {pending.map(r => (
              <div key={r.id} className="resource-card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                <div className={`resource-type-icon ${r.resourceType}`} style={{ width: 36, height: 36 }}>
                  {(() => {
                    const Icon = (RESOURCE_TYPE_CONFIG[r.resourceType] || RESOURCE_TYPE_CONFIG.other).icon;
                    return <Icon size={18} />;
                  })()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)" }}>{r.title}</div>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-secondary)" }}>{r.courseCode}</div>
                </div>
                <span className="rag-badge pending">
                  <Clock size={12} />
                  Pending
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Upload Modal ───

function UploadModal({
  courses, onClose, onUpload,
}: {
  courses: CourseItem[];
  onClose: () => void;
  onUpload: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [resourceType, setResourceType] = useState("syllabus");
  const [tags, setTags] = useState("");
  const [isVisibleToStudents, setIsVisibleToStudents] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file || !courseId || !title.trim()) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("courseId", courseId);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("resourceType", resourceType);
      formData.append("tags", tags);
      formData.append("isVisibleToStudents", String(isVisibleToStudents));

      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API}/resources`, {
        method: "POST",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: formData,
      });

      if (res.ok) {
        onUpload();
      }
    } catch {} finally {
      setUploading(false);
    }
  };

  return (
    <div className="resource-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="resource-modal">
        <div className="resource-modal-header">
          <h2>Upload Resource</h2>
          <button className="resource-modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="resource-modal-body">
          {/* Drop Zone */}
          <div
            className={`drop-zone ${dragOver ? "dragover" : ""}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: "none" }}
              accept=".pdf,.pptx,.ppt,.docx,.doc,.xlsx,.xls,.txt,.md,.zip"
              onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]); }}
            />
            {file ? (
              <div className="drop-zone-file">
                <FileText size={20} />
                <div className="drop-zone-file-info">
                  <div className="drop-zone-file-name">{file.name}</div>
                  <div className="drop-zone-file-size">{formatFileSize(Math.round(file.size / 1024))}</div>
                </div>
                <button
                  style={{ border: "none", background: "none", cursor: "pointer", color: "#ef4444" }}
                  onClick={e => { e.stopPropagation(); setFile(null); }}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <div className="drop-zone-icon"><Upload size={22} /></div>
                <div className="drop-zone-text">Drop your file here or click to browse</div>
                <div className="drop-zone-hint">PDF, PPTX, DOCX, XLSX, TXT, ZIP — up to 100MB</div>
              </>
            )}
          </div>

          {/* Form */}
          <div className="resource-form-group" style={{ marginTop: 20 }}>
            <label>Course *</label>
            <select value={courseId} onChange={e => setCourseId(e.target.value)}>
              <option value="">Select a course...</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.code} – {c.name}</option>
              ))}
            </select>
          </div>

          <div className="resource-form-group">
            <label>Title *</label>
            <input
              type="text"
              placeholder="e.g. Week 3 Lecture Notes: Graph Algorithms"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="resource-form-group">
            <label>Description</label>
            <textarea
              placeholder="Brief description of the resource content..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="resource-form-group">
            <label>Resource Type</label>
            <select value={resourceType} onChange={e => setResourceType(e.target.value)}>
              {Object.entries(RESOURCE_TYPE_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>

          <div className="resource-form-group">
            <label>Tags (comma-separated)</label>
            <input
              type="text"
              placeholder="e.g. algorithms, graphs, week-3"
              value={tags}
              onChange={e => setTags(e.target.value)}
            />
          </div>

          <div className="toggle-row">
            <label style={{ fontSize: "0.85rem", fontWeight: 500 }}>Visible to Students</label>
            <div
              className={`toggle-switch ${isVisibleToStudents ? "on" : ""}`}
              onClick={() => setIsVisibleToStudents(!isVisibleToStudents)}
            />
          </div>

          <div style={{
            marginTop: 14,
            padding: "10px 14px",
            borderRadius: 10,
            background: "rgba(99,102,241,0.06)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: "0.8rem",
            color: "var(--text-secondary)",
          }}>
            <Sparkles size={16} color="#6366f1" />
            <span>This resource will be <strong>automatically indexed</strong> into the AI Copilot&apos;s knowledge base after upload.</span>
          </div>
        </div>

        <div className="resource-modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            disabled={!file || !courseId || !title.trim() || uploading}
            onClick={handleSubmit}
          >
            {uploading ? (
              <><RefreshCw size={14} style={{ animation: "spin 1s linear infinite", marginRight: 6 }} /> Uploading...</>
            ) : (
              <><Upload size={14} style={{ marginRight: 6 }} /> Upload & Index</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Version History Modal ───

function VersionHistoryModal({
  resource, versions, onClose, isFaculty, onUploadNewVersion,
}: {
  resource: ResourceItem;
  versions: ResourceItem[];
  onClose: () => void;
  isFaculty: boolean;
  onUploadNewVersion: () => void;
}) {
  const [showUpload, setShowUpload] = useState(false);
  const [changeNotes, setChangeNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadNewVersion = async () => {
    if (!file) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("changeNotes", changeNotes);

      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API}/resources/${resource.id}/new-version`, {
        method: "POST",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: formData,
      });

      if (res.ok) {
        onUploadNewVersion();
      }
    } catch {} finally {
      setUploading(false);
    }
  };

  return (
    <div className="resource-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="resource-modal" style={{ maxWidth: 500 }}>
        <div className="resource-modal-header">
          <h2>Version History</h2>
          <button className="resource-modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="resource-modal-body">
          <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 10, background: "var(--hover-bg, rgba(0,0,0,0.03))" }}>
            <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>{resource.title}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{resource.courseCode} • Current: v{resource.version}</div>
          </div>

          {/* Version Timeline */}
          <ul className="version-timeline">
            {versions.map((v, idx) => (
              <li key={v.id} className={`version-item ${idx === 0 ? "current" : "old"}`}>
                <div className="version-label">
                  Version {v.version}
                  {idx === 0 && (
                    <span style={{ marginLeft: 8, fontSize: "0.7rem", background: "#22c55e", color: "#fff", padding: "2px 8px", borderRadius: 6 }}>
                      Current
                    </span>
                  )}
                </div>
                {v.changeNotes && <div className="version-notes">{v.changeNotes}</div>}
                <div className="version-meta">
                  {v.originalName} • {formatFileSize(v.fileSizeKB)} • {formatDate(v.updatedAt)} • by {v.uploadedByName}
                </div>
              </li>
            ))}
          </ul>

          {/* Upload New Version */}
          {isFaculty && (
            <div style={{ marginTop: 20 }}>
              {!showUpload ? (
                <button className="btn-primary" style={{ width: "100%" }} onClick={() => setShowUpload(true)}>
                  <ArrowUpCircle size={14} style={{ marginRight: 6 }} />
                  Upload New Version
                </button>
              ) : (
                <div style={{ borderTop: "1px solid var(--border-color, rgba(0,0,0,0.06))", paddingTop: 16 }}>
                  <h4 style={{ fontSize: "0.88rem", fontWeight: 600, marginBottom: 12 }}>Upload v{resource.version + 1}</h4>

                  <div
                    className="drop-zone"
                    style={{ padding: 20 }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      style={{ display: "none" }}
                      accept=".pdf,.pptx,.ppt,.docx,.doc,.xlsx,.xls,.txt,.md,.zip"
                      onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]); }}
                    />
                    {file ? (
                      <div className="drop-zone-file">
                        <FileText size={18} />
                        <div className="drop-zone-file-info">
                          <div className="drop-zone-file-name">{file.name}</div>
                          <div className="drop-zone-file-size">{formatFileSize(Math.round(file.size / 1024))}</div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="drop-zone-text" style={{ fontSize: "0.82rem" }}>Click to select updated file</div>
                      </>
                    )}
                  </div>

                  <div className="resource-form-group" style={{ marginTop: 12 }}>
                    <label>What changed?</label>
                    <textarea
                      placeholder="e.g. Added section on window functions..."
                      value={changeNotes}
                      onChange={e => setChangeNotes(e.target.value)}
                      style={{ minHeight: 60 }}
                    />
                  </div>

                  <button
                    className="btn-primary"
                    style={{ width: "100%" }}
                    disabled={!file || uploading}
                    onClick={handleUploadNewVersion}
                  >
                    {uploading ? "Uploading..." : `Upload v${resource.version + 1}`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
