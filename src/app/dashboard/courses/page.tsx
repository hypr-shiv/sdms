"use client";

import { useState, useEffect, useMemo } from "react";
import { type Role } from "@/lib/mockData";
import {
  BookOpen, Users, MapPin, Clock, Plus, Search,
  GraduationCap, Filter, ChevronRight, User, AlertCircle,
  CheckCircle, ArrowRight, Upload, Download, RefreshCw,
  Layers, GitFork, UserPlus, ListOrdered, ShieldAlert,
  Edit2, Trash2, X, ChevronDown, Check, Info, FileSpreadsheet
} from "lucide-react";
import "../dashboard.css";
import "./courses.css";
import EmptyState from "@/components/UI/EmptyState";

const API = "http://localhost:3001";

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

interface CourseItem {
  id: string;
  code: string;
  name: string;
  departmentId?: string;
  departmentName?: string;
  credits: number;
  level: number;
  instructor?: string;
  capacity: number;
  enrolled: number;
  waitlistCount?: number;
  semester?: string;
  schedule?: string;
  room?: string;
  status: string;
  color?: string;
  description?: string;
  prerequisites?: string;
  syllabus?: string;
}

interface DepartmentItem {
  id: string;
  code: string;
  name: string;
  headOfDepartment?: string;
  totalFaculty: number;
  totalStudents: number;
  isActive: boolean;
  description?: string;
  building?: string;
  courseCount?: number;
}

interface SectionItem {
  id: string;
  name: string;
  courseId: string;
  instructorName?: string;
  capacity: number;
  enrolled: number;
  waitlistCount?: number;
  schedule?: string;
  room?: string;
}

interface EnrollmentItem {
  id: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  courseId: string;
  courseCode: string;
  sectionId?: string;
  sectionName?: string;
  semester?: string;
  status: string;
  waitlistPosition?: number;
  waitlistJoinedAt?: string;
  finalGrade?: number;
  enrolledAt: string;
}

interface GraphData {
  nodes: Array<{
    id: string;
    code: string;
    name: string;
    credits: number;
    level: number;
    department: string;
    color: string;
    capacity: number;
    enrolled: number;
    prerequisites: string[];
  }>;
  edges: Array<{ from: string; to: string; type: string }>;
  levels: Record<string, any[]>;
  summary: {
    totalCourses: number;
    totalPrereqEdges: number;
    rootCourses: string[];
    capstoneCourses: string[];
  };
}

export default function CoursesPage() {
  const [user, setUser] = useState<{ role: Role; userId?: string; email?: string } | null>(null);
  const [view, setView] = useState<"catalog" | "sections" | "departments" | "enrollment" | "graph">("catalog");
  const [loading, setLoading] = useState(true);

  // Core Data
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [graphData, setGraphData] = useState<GraphData | null>(null);

  // Filters & Display
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [layoutMode, setLayoutMode] = useState<"grid" | "table">("grid");

  // Selection & Modals
  const [selectedCourseForDetail, setSelectedCourseForDetail] = useState<CourseItem | null>(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null);
  const [courseFormData, setCourseFormData] = useState<Partial<CourseItem>>({
    code: "", name: "", credits: 3, level: 100, capacity: 50, color: "#6366f1",
    departmentName: "", schedule: "", room: "", instructor: "", prerequisites: "",
    description: "", syllabus: "", status: "active"
  });

  const [showSectionModal, setShowSectionModal] = useState(false);
  const [sectionFormData, setSectionFormData] = useState<Partial<SectionItem>>({
    courseId: "", name: "", instructorName: "", capacity: 30, schedule: "", room: ""
  });

  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptFormData, setDeptFormData] = useState<Partial<DepartmentItem>>({
    code: "", name: "", headOfDepartment: "", totalFaculty: 10, totalStudents: 200, building: "", description: ""
  });

  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [csvImportResult, setCsvImportResult] = useState<any | null>(null);
  const [csvImporting, setCsvImporting] = useState(false);

  // Manual Enrollment State
  const [enrollCourseId, setEnrollCourseId] = useState("");
  const [enrollSectionId, setEnrollSectionId] = useState("");
  const [enrollStudentEmail, setEnrollStudentEmail] = useState("");
  const [enrollStudentName, setEnrollStudentName] = useState("");
  const [enrollOverridePrereqs, setEnrollOverridePrereqs] = useState(false);
  const [prereqCheckResult, setPrereqCheckResult] = useState<any | null>(null);
  const [enrollMessage, setEnrollMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Dependency Graph Interactive State
  const [selectedGraphNode, setSelectedGraphNode] = useState<string | null>(null);
  const [graphStudentFilter, setGraphStudentFilter] = useState<string>("STU-001");

  // Load User & Data
  useEffect(() => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) setUser(JSON.parse(userData));
    } catch {}
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    try {
      const [coursesRes, deptsRes, graphRes, enrollRes] = await Promise.all([
        fetch(`${API}/courses`, { headers: authHeaders() }).catch(() => null),
        fetch(`${API}/departments`, { headers: authHeaders() }).catch(() => null),
        fetch(`${API}/courses/dependency-graph`, { headers: authHeaders() }).catch(() => null),
        fetch(`${API}/courses/enrollments/all`, { headers: authHeaders() }).catch(() => null),
      ]);

      if (coursesRes && coursesRes.ok) {
        const cData = await coursesRes.json();
        setCourses(cData);
      }
      if (deptsRes && deptsRes.ok) {
        const dData = await deptsRes.json();
        setDepartments(dData);
      }
      if (graphRes && graphRes.ok) {
        const gData = await graphRes.json();
        setGraphData(gData);
      }
      if (enrollRes && enrollRes.ok) {
        const eData = await enrollRes.json();
        setEnrollments(eData);
      }

      // Load all sections
      const sectionsRes = await fetch(`${API}/courses/CS301/sections`, { headers: authHeaders() }).catch(() => null);
      if (sectionsRes && sectionsRes.ok) {
        const sData = await sectionsRes.json();
        setSections(sData);
      }
    } catch (err) {
      console.error("Failed to load course data", err);
    } finally {
      setLoading(false);
    }
  }

  // Check prerequisites dynamically whenever course or student changes in manual enrollment
  useEffect(() => {
    if (!enrollCourseId) {
      setPrereqCheckResult(null);
      return;
    }
    const course = courses.find(c => c.id === enrollCourseId);
    if (!course) return;

    fetch(`${API}/courses/${course.id}/prerequisites/check?studentId=STU-001&courseCode=${course.code}`, {
      headers: authHeaders(),
    })
      .then(res => res.json())
      .then(data => setPrereqCheckResult(data))
      .catch(() => setPrereqCheckResult(null));
  }, [enrollCourseId, courses]);

  // Derived Metrics
  const metrics = useMemo(() => {
    const totalCourses = courses.length;
    const totalCapacity = courses.reduce((acc, c) => acc + (c.capacity || 0), 0);
    const totalEnrolled = courses.reduce((acc, c) => acc + (c.enrolled || 0), 0);
    const totalWaitlist = courses.reduce((acc, c) => acc + (c.waitlistCount || 0), 0) +
      enrollments.filter(e => e.status === "waitlisted").length;
    const fillPercent = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;
    return { totalCourses, totalCapacity, totalEnrolled, totalWaitlist, fillPercent };
  }, [courses, enrollments]);

  // Filtered Courses
  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.instructor && c.instructor.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchDept = selectedDept === "all" || c.departmentName === selectedDept || c.departmentId === selectedDept;
      const matchLevel = selectedLevel === "all" || String(c.level) === selectedLevel;
      const matchStatus =
        selectedStatus === "all" ||
        (selectedStatus === "open" && c.enrolled < c.capacity) ||
        (selectedStatus === "full" && c.enrolled >= c.capacity);

      return matchSearch && matchDept && matchLevel && matchStatus;
    });
  }, [courses, searchQuery, selectedDept, selectedLevel, selectedStatus]);

  // Waitlist entries
  const waitlistEntries = useMemo(() => {
    return enrollments
      .filter(e => e.status === "waitlisted")
      .sort((a, b) => (a.waitlistPosition || 0) - (b.waitlistPosition || 0));
  }, [enrollments]);

  const activeEnrollments = useMemo(() => {
    return enrollments.filter(e => e.status === "active");
  }, [enrollments]);

  const myEnrollments = useMemo(() => {
    if (!user) return [];
    return enrollments.filter(
      e => e.studentId === user.userId || e.studentEmail === user.email || (user.role === "student" && e.studentId === "STU-001")
    );
  }, [enrollments, user]);

  // Handlers for Course CRUD
  async function handleSaveCourse(e: React.FormEvent) {
    e.preventDefault();
    try {
      const isEdit = Boolean(editingCourse);
      const url = isEdit ? `${API}/courses/${editingCourse!.id}` : `${API}/courses`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(courseFormData),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to save course");
        return;
      }

      setShowCourseModal(false);
      setEditingCourse(null);
      loadAllData();
    } catch (err: any) {
      alert("Error saving course: " + err.message);
    }
  }

  async function handleDeleteCourse(id: string) {
    if (!confirm("Are you sure you want to delete this course?")) return;
    try {
      const res = await fetch(`${API}/courses/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to delete course");
        return;
      }
      loadAllData();
    } catch (err: any) {
      alert("Error deleting course: " + err.message);
    }
  }

  // Handlers for Department CRUD
  async function handleSaveDepartment(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/departments`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(deptFormData),
      });
      if (!res.ok) throw new Error("Failed to save department");
      setShowDeptModal(false);
      loadAllData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  }

  // Handlers for Section CRUD
  async function handleSaveSection(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (!sectionFormData.courseId) {
        alert("Please select a course for this section");
        return;
      }
      const res = await fetch(`${API}/courses/${sectionFormData.courseId}/sections`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(sectionFormData),
      });
      if (!res.ok) throw new Error("Failed to create section");
      setShowSectionModal(false);
      loadAllData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  }

  // Manual Enrollment Handler
  async function handleManualEnroll(e: React.FormEvent) {
    e.preventDefault();
    setEnrollMessage(null);
    if (!enrollCourseId) {
      setEnrollMessage({ text: "Please select a course to enroll", type: "error" });
      return;
    }

    try {
      const res = await fetch(`${API}/courses/${enrollCourseId}/enroll`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          studentEmail: enrollStudentEmail || "student@scholarpulse.edu",
          studentName: enrollStudentName || "Enrolled Student",
          sectionId: enrollSectionId || undefined,
          overridePrerequisites: enrollOverridePrereqs,
        }),
      });
      const data = await res.json();

      if (data.error) {
        setEnrollMessage({ text: data.error, type: "error" });
      } else if (data.isWaitlisted) {
        setEnrollMessage({ text: `Course is full! Student placed on waitlist (Position #${data.waitlistPosition}).`, type: "info" });
        loadAllData();
      } else {
        setEnrollMessage({ text: "Student successfully enrolled in course!", type: "success" });
        loadAllData();
      }
    } catch (err: any) {
      setEnrollMessage({ text: "Enrollment failed: " + err.message, type: "error" });
    }
  }

  // Student Self-Enroll Handler
  async function handleStudentSelfEnroll(course: CourseItem) {
    try {
      const isFull = (course.enrolled || 0) >= (course.capacity || 0);
      const res = await fetch(`${API}/courses/${course.id}/enroll`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          studentId: user?.userId || "STU-001",
          studentEmail: user?.email || "student@scholarpulse.edu",
        }),
      });
      const data = await res.json();
      if (data.error) {
        alert("Enrollment notice: " + data.error);
      } else if (data.isWaitlisted) {
        alert(`Course reached capacity (${course.enrolled}/${course.capacity}). You have been placed on the waitlist at position #${data.waitlistPosition}.`);
        loadAllData();
      } else {
        alert(`Successfully enrolled in ${course.code} - ${course.name}!`);
        loadAllData();
      }
    } catch (err: any) {
      alert("Enrollment error: " + err.message);
    }
  }

  // Drop Enrollment Handler (triggers auto-promotion!)
  async function handleDropEnrollment(enrollmentId: string) {
    if (!confirm("Are you sure you want to drop this enrollment?")) return;
    try {
      const res = await fetch(`${API}/courses/enrollment/${enrollmentId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.autoPromoted) {
        alert(`Enrollment dropped. Waitlisted student ${data.autoPromoted.studentName} was automatically promoted into ${data.autoPromoted.courseCode}!`);
      } else {
        alert("Enrollment dropped successfully.");
      }
      loadAllData();
    } catch (err: any) {
      alert("Drop failed: " + err.message);
    }
  }

  // Promote Waitlist Student Handler
  async function handlePromoteWaitlist(enrollmentId: string) {
    try {
      const res = await fetch(`${API}/courses/waitlist/${enrollmentId}/promote`, {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Student promoted from waitlist to active enrollment!");
        loadAllData();
      } else {
        alert(data.message || "Failed to promote student");
      }
    } catch (err: any) {
      alert("Promotion error: " + err.message);
    }
  }

  // Batch CSV Import Handler
  async function handleExecuteCsvImport() {
    setCsvImporting(true);
    setCsvImportResult(null);
    try {
      const lines = csvText.trim().split("\n");
      if (lines.length < 2) {
        alert("CSV must have a header line and at least one data row");
        setCsvImporting(false);
        return;
      }
      const headers = lines[0].split(",").map(h => h.trim());
      const rows = [];

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(",").map(p => p.trim());
        if (parts.length >= 2) {
          const rowObj: any = {};
          headers.forEach((h, idx) => {
            rowObj[h] = parts[idx];
          });
          rows.push({
            studentEmail: rowObj.studentEmail || parts[0],
            studentName: rowObj.studentName || parts[1],
            courseCode: rowObj.courseCode || parts[2],
            sectionName: rowObj.sectionName || parts[3],
            semester: rowObj.semester || "FA26",
            overridePrerequisites: rowObj.overridePrerequisites === "true",
          });
        }
      }

      const res = await fetch(`${API}/courses/batch-enroll`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ rows }),
      });
      const result = await res.json();
      setCsvImportResult(result);
      loadAllData();
    } catch (err: any) {
      alert("Batch import error: " + err.message);
    } finally {
      setCsvImporting(false);
    }
  }

  async function handleDownloadCsvTemplate() {
    try {
      const res = await fetch(`${API}/courses/batch-enroll/template`, { headers: authHeaders() });
      const data = await res.json();
      const blob = new Blob([data.template], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename || "course_enrollment_template.csv";
      a.click();
    } catch (err) {
      alert("Failed to download template");
    }
  }

  return (
    <div className="courses-container">
      {/* ─── Header & Top Actions ─── */}
      <div className="page-hero" style={{ marginBottom: 0 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{
              background: "rgba(99, 102, 241, 0.12)", color: "var(--accent-primary)",
              padding: "4px 10px", borderRadius: 8, fontSize: "0.75rem", fontWeight: 700,
              textTransform: "uppercase", letterSpacing: 0.5
            }}>
              Academic Management • Fall 2026
            </span>
          </div>
          <h1 className="page-title" style={{ marginBottom: 6 }}>Course Management System</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Curriculum orchestration, sections, waitlist queues, prerequisite graphs, and automated batch enrollment.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {user?.role === "admin" && (
            <>
              <button
                onClick={() => setShowCsvModal(true)}
                style={{
                  background: "var(--bg-secondary)", color: "var(--text-primary)",
                  border: "1px solid var(--border-primary)", padding: "9px 16px",
                  borderRadius: 10, fontSize: "0.85rem", fontWeight: 600,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <Upload size={15} /> Batch CSV Import
              </button>

              <button
                onClick={() => {
                  setEditingCourse(null);
                  setCourseFormData({
                    code: "", name: "", credits: 3, level: 100, capacity: 50, color: "#6366f1",
                    departmentName: departments[0]?.name || "Computer Science & AI",
                    schedule: "MWF 10:00-11:00", room: "Room 101", instructor: "Dr. Sarah Mitchell",
                    prerequisites: "", description: "", syllabus: "", status: "active"
                  });
                  setShowCourseModal(true);
                }}
                style={{
                  background: "var(--accent-primary)", color: "#fff",
                  border: "none", padding: "9px 18px", borderRadius: 10,
                  fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                  boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)"
                }}
              >
                <Plus size={16} /> New Course
              </button>
            </>
          )}
        </div>
      </div>

      {/* ─── Metric Stat Cards ─── */}
      <div className="stats-banner">
        <div className="stat-metric-card">
          <div className="stat-metric-icon" style={{ background: "rgba(99, 102, 241, 0.12)", color: "#6366f1" }}>
            <BookOpen size={22} />
          </div>
          <div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", fontWeight: 600 }}>Active Courses</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-primary)" }}>{metrics.totalCourses}</div>
          </div>
        </div>

        <div className="stat-metric-card">
          <div className="stat-metric-icon" style={{ background: "rgba(168, 85, 247, 0.12)", color: "#a855f7" }}>
            <GraduationCap size={22} />
          </div>
          <div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", fontWeight: 600 }}>Departments</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-primary)" }}>{departments.length}</div>
          </div>
        </div>

        <div className="stat-metric-card">
          <div className="stat-metric-icon" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", fontWeight: 600 }}>Total Enrolled</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-primary)" }}>
              {metrics.totalEnrolled} <span style={{ fontSize: "0.85rem", color: "var(--text-tertiary)", fontWeight: 400 }}>/ {metrics.totalCapacity}</span>
            </div>
          </div>
        </div>

        {user?.role === "admin" && (
          <div className="stat-metric-card">
            <div className="stat-metric-icon" style={{ background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}>
              <ListOrdered size={22} />
            </div>
            <div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", fontWeight: 600 }}>Waitlist (Admin)</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#f59e0b" }}>{metrics.totalWaitlist}</div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Navigation Tabs ─── */}
      <div className="courses-nav-tabs">
        <button
          className={`course-tab-btn ${view === "catalog" ? "active" : ""}`}
          onClick={() => setView("catalog")}
        >
          <BookOpen size={16} /> Course Catalog ({courses.length})
        </button>
        <button
          className={`course-tab-btn ${view === "sections" ? "active" : ""}`}
          onClick={() => setView("sections")}
        >
          <Layers size={16} /> Sections Management
        </button>
        <button
          className={`course-tab-btn ${view === "departments" ? "active" : ""}`}
          onClick={() => setView("departments")}
        >
          <GraduationCap size={16} /> Departments ({departments.length})
        </button>
        <button
          className={`course-tab-btn ${view === "graph" ? "active" : ""}`}
          onClick={() => setView("graph")}
        >
          <GitFork size={16} /> Prerequisite Dependency Graph
        </button>
        {user?.role === "admin" && (
          <button
            className={`course-tab-btn ${view === "enrollment" ? "active" : ""}`}
            onClick={() => setView("enrollment")}
            style={{ borderLeft: "2px solid var(--border-primary)", paddingLeft: 12 }}
          >
            <UserPlus size={16} style={{ color: "var(--accent-primary)" }} />
            <span style={{ fontWeight: 600 }}>Admin: Enrollment & Waitlist Hub</span>
            {waitlistEntries.length > 0 && (
              <span style={{
                background: "#f59e0b", color: "#fff", padding: "1px 6px",
                borderRadius: 10, fontSize: "0.7rem", fontWeight: 700, marginLeft: 4
              }}>
                {waitlistEntries.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════
          TAB 1: COURSE CATALOG
          ════════════════════════════════════════════════════════════ */}
      {view === "catalog" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Filter Bar */}
          <div className="filter-action-bar">
            <div className="search-box-wrap">
              <Search size={16} style={{ color: "var(--text-tertiary)" }} />
              <input
                placeholder="Search by code, title, instructor..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}>
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="filter-chips-row">
              <button
                className={`filter-chip ${selectedDept === "all" ? "active" : ""}`}
                onClick={() => setSelectedDept("all")}
              >
                All Departments
              </button>
              {departments.map(d => (
                <button
                  key={d.id}
                  className={`filter-chip ${selectedDept === d.name ? "active" : ""}`}
                  onClick={() => setSelectedDept(d.name)}
                >
                  {d.code}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select
                value={selectedLevel}
                onChange={e => setSelectedLevel(e.target.value)}
                style={{
                  background: "var(--bg-secondary)", border: "1px solid var(--border-primary)",
                  borderRadius: 8, padding: "6px 12px", fontSize: "0.8rem", color: "var(--text-primary)"
                }}
              >
                <option value="all">All Levels</option>
                <option value="100">100-Level (Intro)</option>
                <option value="200">200-Level (Core)</option>
                <option value="300">300-Level (Advanced)</option>
                <option value="400">400-Level (Specialized)</option>
              </select>

              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                style={{
                  background: "var(--bg-secondary)", border: "1px solid var(--border-primary)",
                  borderRadius: 8, padding: "6px 12px", fontSize: "0.8rem", color: "var(--text-primary)"
                }}
              >
                <option value="all">All Capacities</option>
                <option value="open">Seats Open</option>
                <option value="full">Full / Waitlisted</option>
              </select>
            </div>
          </div>

          {/* Student Portal: My Current Enrollments & Waitlists */}
          {user?.role === "student" && myEnrollments.length > 0 && (
            <div style={{
              background: "var(--bg-card)", border: "1px solid var(--border-primary)",
              borderRadius: 14, padding: "18px 20px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <User size={16} style={{ color: "var(--accent-primary)" }} />
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                    My Registered Courses & Waitlist Status
                  </h3>
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
                  {myEnrollments.filter(e => e.status === "active").length} Enrolled • {myEnrollments.filter(e => e.status === "waitlisted").length} Waitlisted
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
                {myEnrollments.map(enr => {
                  const courseObj = courses.find(c => c.id === enr.courseId || c.code === enr.courseCode);
                  const isWaitlist = enr.status === "waitlisted";
                  return (
                    <div key={enr.id} style={{
                      background: "var(--bg-secondary)", borderRadius: 10, padding: "12px 14px",
                      border: `1px solid ${isWaitlist ? "#f59e0b40" : "#10b98140"}`
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{
                          fontWeight: 700, fontSize: "0.82rem",
                          color: courseObj?.color || "#6366f1"
                        }}>
                          {enr.courseCode}
                        </span>
                        <span style={{
                          fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                          background: isWaitlist ? "rgba(245, 158, 11, 0.15)" : "rgba(16, 185, 129, 0.15)",
                          color: isWaitlist ? "#f59e0b" : "#10b981"
                        }}>
                          {isWaitlist ? `Waitlist #${enr.waitlistPosition}` : "✓ Active"}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                        {courseObj?.name || "Academic Course"}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-tertiary)" }}>
                          {courseObj?.credits || 3} Credits • {enr.semester || "FA26"}
                        </span>
                        <button
                          onClick={() => handleDropEnrollment(enr.id)}
                          style={{
                            background: "transparent", border: "1px solid #ef444440", color: "#ef4444",
                            fontSize: "0.7rem", padding: "2px 8px", borderRadius: 4, cursor: "pointer"
                          }}
                        >
                          Drop
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Courses Grid */}
          <div className="courses-grid">
            {filteredCourses.map(course => {
              const capPercent = Math.round(((course.enrolled || 0) / (course.capacity || 1)) * 100);
              const isFull = (course.enrolled || 0) >= (course.capacity || 0);
              const prereqList = (course.prerequisites || "").split(",").map(p => p.trim()).filter(Boolean);

              return (
                <div key={course.id} className="course-card-enhanced">
                  <div className="course-card-color-bar" style={{ background: course.color || "#6366f1" }} />

                  <div className="course-card-body">
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span className="course-code-badge" style={{
                          color: course.color || "#6366f1",
                          background: `${course.color || "#6366f1"}18`
                        }}>
                          {course.code}
                        </span>
                        <span style={{
                          fontSize: "0.7rem", color: "var(--text-tertiary)",
                          background: "var(--bg-secondary)", padding: "2px 6px", borderRadius: 4, fontWeight: 600
                        }}>
                          {course.level}L
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span className={`course-status-badge ${isFull ? "badge-full" : "badge-open"}`}>
                          {isFull ? "Full" : "Open"}
                        </span>
                        {course.waitlistCount && course.waitlistCount > 0 ? (
                          <span className="course-status-badge badge-waitlist">
                            Waitlist: {course.waitlistCount}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Course Title */}
                    <h3 style={{
                      fontSize: "0.98rem", fontWeight: 600, color: "var(--text-primary)",
                      marginBottom: 8, lineHeight: 1.3
                    }}>
                      {course.name}
                    </h3>

                    {/* Meta info */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        <User size={13} style={{ color: "var(--text-tertiary)" }} /> {course.instructor || "Faculty Assigned"}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        <Clock size={13} style={{ color: "var(--text-tertiary)" }} /> {course.schedule || "TBA"}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        <MapPin size={13} style={{ color: "var(--text-tertiary)" }} /> {course.room || "Main Campus"}
                      </div>
                    </div>

                    {/* Prerequisites */}
                    {prereqList.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", fontWeight: 600, marginRight: 6 }}>
                          Prereqs:
                        </span>
                        <div style={{ display: "inline-flex", gap: 4, flexWrap: "wrap" }}>
                          {prereqList.map(pr => (
                            <span key={pr} className="prereq-pill">
                              <GitFork size={10} /> {pr}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Capacity Meter */}
                    <div className="capacity-meter-wrap">
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>Capacity</span>
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                          {course.enrolled} / {course.capacity} ({capPercent}%)
                        </span>
                      </div>
                      <div className="capacity-meter-track">
                        <div
                          className="capacity-meter-fill"
                          style={{
                            width: `${Math.min(capPercent, 100)}%`,
                            background: capPercent >= 100 ? "#ef4444" : capPercent >= 80 ? "#f59e0b" : "#10b981",
                          }}
                        />
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      paddingTop: 12, borderTop: "1px solid var(--border-primary)", marginTop: "auto"
                    }}>
                      <span style={{
                        fontSize: "0.78rem", color: "var(--text-secondary)",
                        display: "flex", alignItems: "center", gap: 4
                      }}>
                        <GraduationCap size={14} /> {course.credits} Credits
                      </span>

                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {user?.role === "student" && (() => {
                          const myEnr = myEnrollments.find(e => e.courseId === course.id || e.courseCode === course.code);
                          if (myEnr) {
                            return myEnr.status === "waitlisted" ? (
                              <span style={{
                                fontSize: "0.72rem", color: "#f59e0b", background: "rgba(245, 158, 11, 0.12)",
                                padding: "4px 8px", borderRadius: 6, fontWeight: 700
                              }}>
                                Waitlist #{myEnr.waitlistPosition}
                              </span>
                            ) : (
                              <span style={{
                                fontSize: "0.72rem", color: "#10b981", background: "rgba(16, 185, 129, 0.12)",
                                padding: "4px 8px", borderRadius: 6, fontWeight: 700
                              }}>
                                ✓ Enrolled
                              </span>
                            );
                          }
                          return (
                            <button
                              onClick={() => handleStudentSelfEnroll(course)}
                              style={{
                                background: isFull ? "#f59e0b" : "var(--accent-primary)",
                                color: "#fff", border: "none", borderRadius: 6,
                                padding: "5px 12px", fontSize: "0.75rem", cursor: "pointer", fontWeight: 600
                              }}
                            >
                              {isFull ? "Join Waitlist" : "Enroll"}
                            </button>
                          );
                        })()}

                        <button
                          onClick={() => setSelectedCourseForDetail(course)}
                          style={{
                            background: "var(--bg-secondary)", border: "1px solid var(--border-primary)",
                            borderRadius: 6, padding: "5px 10px", fontSize: "0.75rem",
                            cursor: "pointer", color: "var(--text-primary)", fontWeight: 500
                          }}
                        >
                          Details
                        </button>

                        {(user?.role === "admin" || user?.role === "teacher") && (
                          <button
                            onClick={() => {
                              setEditingCourse(course);
                              setCourseFormData(course);
                              setShowCourseModal(true);
                            }}
                            style={{
                              background: "none", border: "1px solid var(--border-primary)",
                              borderRadius: 6, padding: "5px 8px", fontSize: "0.75rem",
                              cursor: "pointer", color: "var(--text-secondary)"
                            }}
                            title="Edit Course"
                          >
                            <Edit2 size={13} />
                          </button>
                        )}

                        {user?.role === "admin" && (
                          <button
                            onClick={() => handleDeleteCourse(course.id)}
                            style={{
                              background: "none", border: "1px solid var(--border-primary)",
                              borderRadius: 6, padding: "5px 8px", fontSize: "0.75rem",
                              cursor: "pointer", color: "#ef4444"
                            }}
                            title="Delete Course"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB 2: SECTIONS MANAGEMENT
          ════════════════════════════════════════════════════════════ */}
      {view === "sections" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>Course Sections</h2>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                Manage individual class schedules, room allocations, instructor assignments, and cohort capacities.
              </p>
            </div>
            {user?.role === "admin" && (
              <button
                onClick={() => {
                  setSectionFormData({ courseId: courses[0]?.id || "", name: "Section A", capacity: 30 });
                  setShowSectionModal(true);
                }}
                style={{
                  background: "var(--accent-primary)", color: "#fff", border: "none",
                  padding: "9px 16px", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <Plus size={16} /> Add Section
              </button>
            )}
          </div>

          <div className="sections-grid">
            {courses.map(course => (
              <div key={course.id} className="section-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span style={{
                      fontSize: "0.75rem", fontWeight: 700, color: course.color || "#6366f1",
                      background: `${course.color || "#6366f1"}15`, padding: "2px 8px", borderRadius: 4
                    }}>
                      {course.code}
                    </span>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", marginTop: 4 }}>
                      {course.name}
                    </h3>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
                    {course.semester || "FA26"}
                  </span>
                </div>

                <div style={{ background: "var(--bg-secondary)", borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
                    Section 01 - Primary
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                    <div>Instructor: {course.instructor || "TBA"}</div>
                    <div>Schedule: {course.schedule || "TBA"}</div>
                    <div>Room: {course.room || "TBA"}</div>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: 3 }}>
                      <span>Enrolled</span>
                      <span>{course.enrolled} / {course.capacity}</span>
                    </div>
                    <div className="capacity-meter-track" style={{ height: 5 }}>
                      <div
                        className="capacity-meter-fill"
                        style={{
                          width: `${Math.min(100, Math.round(((course.enrolled || 0) / (course.capacity || 1)) * 100))}%`,
                          background: course.enrolled >= course.capacity ? "#ef4444" : "#10b981",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB 3: DEPARTMENTS CONSOLE
          ════════════════════════════════════════════════════════════ */}
      {view === "departments" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>Academic Departments</h2>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                Colleges, faculty distribution, student allocations, and departmental head leadership.
              </p>
            </div>
            {user?.role === "admin" && (
              <button
                onClick={() => {
                  setDeptFormData({ code: "", name: "", headOfDepartment: "", totalFaculty: 12, totalStudents: 300 });
                  setShowDeptModal(true);
                }}
                style={{
                  background: "var(--accent-primary)", color: "#fff", border: "none",
                  padding: "9px 16px", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <Plus size={16} /> Add Department
              </button>
            )}
          </div>

          <div className="departments-grid">
            {departments.map(dept => (
              <div key={dept.id} className="department-card">
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div className="dept-icon-box">{dept.code}</div>
                  <div>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>
                      {dept.name}
                    </h3>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-tertiary)" }}>
                      {dept.building || "Academic Quad"}
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.4, margin: 0 }}>
                  {dept.description || "Leading research and undergraduate degree programs."}
                </p>

                <div style={{
                  padding: "10px 14px", background: "var(--bg-secondary)",
                  borderRadius: 10, fontSize: "0.82rem", color: "var(--text-primary)"
                }}>
                  <span style={{ color: "var(--text-tertiary)", fontWeight: 500 }}>Department Head: </span>
                  <span style={{ fontWeight: 600 }}>{dept.headOfDepartment || "Prof. Dr. Head"}</span>
                </div>

                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8,
                  paddingTop: 8, borderTop: "1px solid var(--border-primary)"
                }}>
                  <div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)" }}>Faculty</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>
                      {dept.totalFaculty}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)" }}>Students</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>
                      {dept.totalStudents}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)" }}>Courses</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--accent-primary)" }}>
                      {dept.courseCount || courses.filter(c => c.departmentName === dept.name || c.departmentId === dept.id).length}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB 4: ENROLLMENT & WAITLIST HUB (ADMIN ONLY)
          ════════════════════════════════════════════════════════════ */}
      {view === "enrollment" && user?.role === "admin" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Admin Command Center Notice */}
          <div style={{
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.08))",
            border: "1px solid rgba(99, 102, 241, 0.2)",
            borderRadius: 12, padding: "14px 18px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            flexWrap: "wrap", gap: 10
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <ShieldAlert size={22} style={{ color: "var(--accent-primary)" }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--text-primary)" }}>
                  Institutional Enrollment & Waitlist Command Hub (Admin Exclusive)
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  Only administrators have authority to manually enroll students, manage waitlist queues, promote waitlisted candidates, and drop registrations.
                </div>
              </div>
            </div>
            <span style={{
              background: "var(--accent-primary)", color: "#fff",
              padding: "4px 12px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 700
            }}>
              Admin Privileges Active
            </span>
          </div>

          <div className="enrollment-hub-grid">
            {/* Left Column: Quick Manual Enrollment Form */}
            <div style={{
              background: "var(--bg-card)", border: "1px solid var(--border-primary)",
              borderRadius: 14, padding: 22, display: "flex", flexDirection: "column", gap: 16
            }}>
              <div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                  Manual Student Enrollment
                </h3>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  Enroll a student into a course or section with automatic prerequisite checks and capacity overflow waitlist handling.
                </p>
              </div>

              {enrollMessage && (
                <div style={{
                  padding: "10px 14px", borderRadius: 8, fontSize: "0.82rem",
                  background: enrollMessage.type === "success" ? "rgba(16, 185, 129, 0.12)" :
                    enrollMessage.type === "error" ? "rgba(239, 68, 68, 0.12)" : "rgba(245, 158, 11, 0.12)",
                  color: enrollMessage.type === "success" ? "#10b981" :
                    enrollMessage.type === "error" ? "#ef4444" : "#f59e0b",
                  border: `1px solid ${enrollMessage.type === "success" ? "#10b98140" : enrollMessage.type === "error" ? "#ef444440" : "#f59e0b40"}`
                }}>
                  {enrollMessage.text}
                </div>
              )}

              <form onSubmit={handleManualEnroll} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="form-group-custom">
                  <label>Course *</label>
                  <select
                    className="form-control-custom"
                    value={enrollCourseId}
                    onChange={e => setEnrollCourseId(e.target.value)}
                    required
                  >
                    <option value="">Select course...</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.code} - {c.name} ({c.enrolled}/{c.capacity} enrolled)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Prerequisite Check Alert */}
                {prereqCheckResult && (
                  <div style={{
                    padding: "8px 12px", borderRadius: 8, fontSize: "0.78rem",
                    background: prereqCheckResult.satisfied ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                    border: `1px solid ${prereqCheckResult.satisfied ? "#10b98130" : "#ef444430"}`,
                    color: prereqCheckResult.satisfied ? "#10b981" : "#ef4444"
                  }}>
                    {prereqCheckResult.satisfied ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <CheckCircle size={14} /> Prerequisites satisfied
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
                          <AlertCircle size={14} /> Missing Prerequisites:
                        </div>
                        <div>Required: {prereqCheckResult.missing.join(", ")}</div>
                      </div>
                    )}
                  </div>
                )}

                <div className="form-group-custom">
                  <label>Student Email *</label>
                  <input
                    className="form-control-custom"
                    type="email"
                    placeholder="student@scholarpulse.edu"
                    value={enrollStudentEmail}
                    onChange={e => setEnrollStudentEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group-custom">
                  <label>Student Full Name</label>
                  <input
                    className="form-control-custom"
                    placeholder="e.g. Alex Mercer"
                    value={enrollStudentName}
                    onChange={e => setEnrollStudentName(e.target.value)}
                  />
                </div>

                {user?.role === "admin" && (
                  <label style={{
                    display: "flex", alignItems: "center", gap: 8, fontSize: "0.8rem",
                    color: "var(--text-secondary)", cursor: "pointer", marginTop: 4
                  }}>
                    <input
                      type="checkbox"
                      checked={enrollOverridePrereqs}
                      onChange={e => setEnrollOverridePrereqs(e.target.checked)}
                    />
                    Advisor Override (bypass prerequisite validation)
                  </label>
                )}

                <button
                  type="submit"
                  style={{
                    background: "var(--accent-primary)", color: "#fff", border: "none",
                    padding: "10px", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600,
                    cursor: "pointer", marginTop: 8, display: "flex", alignItems: "center",
                    justifyContent: "center", gap: 6
                  }}
                >
                  <UserPlus size={16} /> Submit Enrollment
                </button>
              </form>
            </div>

            {/* Right Column: Waitlist Queue & Active Enrollments */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Waitlist Queue Banner */}
              <div style={{
                background: "var(--bg-card)", border: "1px solid var(--border-primary)",
                borderRadius: 14, padding: 20
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                      <ListOrdered size={18} style={{ color: "#f59e0b" }} /> Waitlist Queue
                      <span style={{
                        background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b",
                        fontSize: "0.75rem", padding: "2px 8px", borderRadius: 12, fontWeight: 700
                      }}>
                        {waitlistEntries.length} In Queue
                      </span>
                    </h3>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 2 }}>
                      Students waiting for capacity to open. When an active student drops, position #1 is automatically promoted.
                    </p>
                  </div>
                </div>

                {waitlistEntries.length === 0 ? (
                  <EmptyState
                    compact
                    variant="courses"
                    title="Waitlist Clear"
                    description="No students are currently waiting in the enrollment queue for this course."
                  />
                ) : (
                  <table className="enrollment-table">
                    <thead>
                      <tr>
                        <th>Position</th>
                        <th>Student</th>
                        <th>Course</th>
                        <th>Joined At</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {waitlistEntries.map(entry => (
                        <tr key={entry.id}>
                          <td>
                            <span className="waitlist-pos-badge">#{entry.waitlistPosition}</span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{entry.studentName || "Student"}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>{entry.studentEmail || entry.studentId}</div>
                          </td>
                          <td>
                            <span style={{
                              fontWeight: 600, color: "var(--accent-primary)",
                              background: "rgba(99, 102, 241, 0.1)", padding: "2px 8px", borderRadius: 4
                            }}>
                              {entry.courseCode}
                            </span>
                          </td>
                          <td style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                            {entry.waitlistJoinedAt ? new Date(entry.waitlistJoinedAt).toLocaleDateString() : "Recent"}
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                onClick={() => handlePromoteWaitlist(entry.id)}
                                style={{
                                  background: "#10b981", color: "#fff", border: "none",
                                  padding: "5px 10px", borderRadius: 6, fontSize: "0.75rem",
                                  cursor: "pointer", fontWeight: 600
                                }}
                              >
                                Promote to Enrolled
                              </button>
                              <button
                                onClick={() => handleDropEnrollment(entry.id)}
                                style={{
                                  background: "transparent", color: "#ef4444", border: "1px solid #ef444440",
                                  padding: "5px 8px", borderRadius: 6, fontSize: "0.75rem", cursor: "pointer"
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Active Enrollments Table */}
              <div style={{
                background: "var(--bg-card)", border: "1px solid var(--border-primary)",
                borderRadius: 14, padding: 20
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                      Active Enrollments ({activeEnrollments.length})
                    </h3>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 2 }}>
                      Students actively taking courses for Fall 2026.
                    </p>
                  </div>
                </div>

                {activeEnrollments.length === 0 ? (
                  <EmptyState
                    compact
                    variant="courses"
                    title="No Enrollments Recorded"
                    description="No students have registered for this course section yet."
                  />
                ) : (
                  <div style={{ maxHeight: 360, overflowY: "auto" }}>
                    <table className="enrollment-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Course</th>
                          <th>Semester</th>
                          <th>Enrolled Date</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeEnrollments.map(e => (
                          <tr key={e.id}>
                            <td>
                              <div style={{ fontWeight: 600 }}>{e.studentName || "Student"}</div>
                              <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>{e.studentEmail || e.studentId}</div>
                            </td>
                            <td>
                              <span style={{
                                fontWeight: 700, color: "#6366f1",
                                background: "rgba(99, 102, 241, 0.1)", padding: "2px 8px", borderRadius: 4
                              }}>
                                {e.courseCode}
                              </span>
                            </td>
                            <td>{e.semester || "FA26"}</td>
                            <td style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                              {new Date(e.enrolledAt).toLocaleDateString()}
                            </td>
                            <td>
                              <button
                                onClick={() => handleDropEnrollment(e.id)}
                                style={{
                                  background: "none", border: "1px solid #ef444450", color: "#ef4444",
                                  padding: "4px 8px", borderRadius: 6, fontSize: "0.75rem", cursor: "pointer"
                                }}
                              >
                                Drop Course
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB 5: PREREQUISITE DEPENDENCY GRAPH (DAG)
          ════════════════════════════════════════════════════════════ */}
      {view === "graph" && (
        <div className="dag-container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                <GitFork size={20} style={{ color: "var(--accent-primary)" }} /> Prerequisite Dependency Graph
              </h2>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                Directed Acyclic Graph (DAG) visualizing degree progression from 100-level foundations to 400-level capstones.
              </p>
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem" }}>
                <span style={{ color: "var(--text-tertiary)" }}>Legend:</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#10b981" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} /> Required Prereq
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#f59e0b" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b" }} /> Unlocks Course
                </span>
              </div>
            </div>
          </div>

          {/* Graph Tiers */}
          <div className="dag-tiers-wrapper">
            {(["100", "200", "300", "400"] as const).map(lvl => {
              const tierCourses = courses.filter(c => String(c.level) === lvl);
              const tierTitle = lvl === "100" ? "Foundation (100-Level)" :
                lvl === "200" ? "Core (200-Level)" :
                lvl === "300" ? "Advanced (300-Level)" : "Specialization (400-Level)";

              return (
                <div key={lvl} className="dag-tier-column">
                  <div className="dag-tier-header">
                    <span>{tierTitle}</span>
                    <span style={{
                      background: "var(--bg-card)", padding: "2px 8px",
                      borderRadius: 12, fontSize: "0.75rem", color: "var(--text-tertiary)"
                    }}>
                      {tierCourses.length}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {tierCourses.map(course => {
                      const isSelected = selectedGraphNode === course.code;
                      const isPrereqOfSelected = selectedGraphNode ? (
                        courses.find(c => c.code === selectedGraphNode)?.prerequisites?.split(",").map(p => p.trim()).includes(course.code)
                      ) : false;
                      const isDependentOfSelected = selectedGraphNode ? (
                        course.prerequisites?.split(",").map(p => p.trim()).includes(selectedGraphNode)
                      ) : false;

                      return (
                        <div
                          key={course.id}
                          className={`dag-node-card ${isSelected ? "selected" : ""} ${isPrereqOfSelected ? "prereq-highlight" : ""} ${isDependentOfSelected ? "dependent-highlight" : ""}`}
                          onClick={() => setSelectedGraphNode(isSelected ? null : course.code)}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <span style={{
                              fontWeight: 700, fontSize: "0.82rem", color: course.color || "#6366f1"
                            }}>
                              {course.code}
                            </span>
                            <span style={{ fontSize: "0.72rem", color: "var(--text-tertiary)" }}>
                              {course.credits} cr
                            </span>
                          </div>

                          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
                            {course.name}
                          </div>

                          {course.prerequisites ? (
                            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", display: "flex", gap: 4, flexWrap: "wrap" }}>
                              <span style={{ color: "var(--text-tertiary)" }}>Needs:</span>
                              {course.prerequisites.split(",").map(p => (
                                <span key={p} style={{
                                  background: "var(--bg-secondary)", padding: "1px 5px",
                                  borderRadius: 4, fontWeight: 600
                                }}>
                                  {p.trim()}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div style={{ fontSize: "0.72rem", color: "#10b981", fontWeight: 500 }}>
                              ✓ No prerequisites (Entry)
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Inspection Detail Bar */}
          {selectedGraphNode && (
            <div style={{
              background: "var(--bg-secondary)", border: "1px solid var(--border-primary)",
              borderRadius: 12, padding: 18, display: "flex", justifyContent: "space-between",
              alignItems: "center", flexWrap: "wrap", gap: 14
            }}>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--accent-primary)", fontWeight: 700 }}>
                  SELECTED NODE INSPECTOR
                </span>
                <h4 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", margin: "2px 0" }}>
                  {selectedGraphNode} - {courses.find(c => c.code === selectedGraphNode)?.name}
                </h4>
                <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                  {courses.find(c => c.code === selectedGraphNode)?.description}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => {
                    const c = courses.find(item => item.code === selectedGraphNode);
                    if (c) setSelectedCourseForDetail(c);
                  }}
                  style={{
                    background: "var(--accent-primary)", color: "#fff", border: "none",
                    padding: "8px 16px", borderRadius: 8, fontSize: "0.8rem", fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  View Full Syllabus & Details
                </button>
                <button
                  onClick={() => setSelectedGraphNode(null)}
                  style={{
                    background: "var(--bg-card)", border: "1px solid var(--border-primary)",
                    padding: "8px 12px", borderRadius: 8, fontSize: "0.8rem", cursor: "pointer",
                    color: "var(--text-secondary)"
                  }}
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          MODAL: CREATE / EDIT COURSE
          ════════════════════════════════════════════════════════════ */}
      {showCourseModal && (
        <div className="modal-overlay">
          <div className="modal-content-card">
            <div className="modal-header">
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                {editingCourse ? "Edit Course Details" : "Create New Course"}
              </h3>
              <button
                onClick={() => setShowCourseModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCourse}>
              <div className="modal-body">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
                  <div className="form-group-custom">
                    <label>Course Code *</label>
                    <input
                      className="form-control-custom"
                      placeholder="e.g. CS301"
                      value={courseFormData.code || ""}
                      onChange={e => setCourseFormData({ ...courseFormData, code: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>
                  <div className="form-group-custom">
                    <label>Course Name *</label>
                    <input
                      className="form-control-custom"
                      placeholder="e.g. Data Structures & Algorithms"
                      value={courseFormData.name || ""}
                      onChange={e => setCourseFormData({ ...courseFormData, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <div className="form-group-custom">
                    <label>Department</label>
                    <select
                      className="form-control-custom"
                      value={courseFormData.departmentName || ""}
                      onChange={e => setCourseFormData({ ...courseFormData, departmentName: e.target.value })}
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group-custom">
                    <label>Credits</label>
                    <input
                      className="form-control-custom"
                      type="number"
                      min={1}
                      max={6}
                      value={courseFormData.credits || 3}
                      onChange={e => setCourseFormData({ ...courseFormData, credits: Number(e.target.value) })}
                    />
                  </div>

                  <div className="form-group-custom">
                    <label>Level</label>
                    <select
                      className="form-control-custom"
                      value={courseFormData.level || 100}
                      onChange={e => setCourseFormData({ ...courseFormData, level: Number(e.target.value) })}
                    >
                      <option value={100}>100 (Introductory)</option>
                      <option value={200}>200 (Intermediate)</option>
                      <option value={300}>300 (Advanced)</option>
                      <option value={400}>400 (Specialized)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="form-group-custom">
                    <label>Instructor</label>
                    <input
                      className="form-control-custom"
                      placeholder="e.g. Dr. Sarah Mitchell"
                      value={courseFormData.instructor || ""}
                      onChange={e => setCourseFormData({ ...courseFormData, instructor: e.target.value })}
                    />
                  </div>

                  <div className="form-group-custom">
                    <label>Capacity (Max Enrolled)</label>
                    <input
                      className="form-control-custom"
                      type="number"
                      value={courseFormData.capacity || 50}
                      onChange={e => setCourseFormData({ ...courseFormData, capacity: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="form-group-custom">
                    <label>Schedule</label>
                    <input
                      className="form-control-custom"
                      placeholder="e.g. MWF 10:00-11:00"
                      value={courseFormData.schedule || ""}
                      onChange={e => setCourseFormData({ ...courseFormData, schedule: e.target.value })}
                    />
                  </div>

                  <div className="form-group-custom">
                    <label>Room / Location</label>
                    <input
                      className="form-control-custom"
                      placeholder="e.g. Hall 204"
                      value={courseFormData.room || ""}
                      onChange={e => setCourseFormData({ ...courseFormData, room: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group-custom">
                  <label>Prerequisites (Comma-separated codes, e.g. CS101, CS201)</label>
                  <input
                    className="form-control-custom"
                    placeholder="e.g. CS101, MTH101"
                    value={courseFormData.prerequisites || ""}
                    onChange={e => setCourseFormData({ ...courseFormData, prerequisites: e.target.value })}
                  />
                  <span style={{ fontSize: "0.72rem", color: "var(--text-tertiary)" }}>
                    Cycle detection is enforced. Specifying circular dependencies will be automatically blocked.
                  </span>
                </div>

                <div className="form-group-custom">
                  <label>Description</label>
                  <textarea
                    className="form-control-custom"
                    rows={2}
                    placeholder="Course objectives and learning outcomes..."
                    value={courseFormData.description || ""}
                    onChange={e => setCourseFormData({ ...courseFormData, description: e.target.value })}
                  />
                </div>

                <div className="form-group-custom">
                  <label>Syllabus Outline (Markdown / Text)</label>
                  <textarea
                    className="form-control-custom"
                    rows={3}
                    placeholder="Week 1: Foundations..."
                    value={courseFormData.syllabus || ""}
                    onChange={e => setCourseFormData({ ...courseFormData, syllabus: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  style={{
                    background: "var(--bg-card)", border: "1px solid var(--border-primary)",
                    padding: "8px 16px", borderRadius: 8, fontSize: "0.85rem", cursor: "pointer",
                    color: "var(--text-secondary)"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: "var(--accent-primary)", color: "#fff", border: "none",
                    padding: "8px 18px", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  {editingCourse ? "Update Course" : "Create Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          MODAL: BATCH CSV ENROLLMENT
          ════════════════════════════════════════════════════════════ */}
      {showCsvModal && (
        <div className="modal-overlay">
          <div className="modal-content-card" style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                  Batch CSV Student Enrollment
                </h3>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0 }}>
                  Import hundreds of student course registrations in one pass with full prerequisite and capacity checking.
                </p>
              </div>
              <button
                onClick={() => setShowCsvModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  CSV Data Input
                </span>
                <button
                  onClick={handleDownloadCsvTemplate}
                  style={{
                    background: "var(--bg-secondary)", border: "1px solid var(--border-primary)",
                    padding: "4px 10px", borderRadius: 6, fontSize: "0.75rem", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 4, color: "var(--text-secondary)"
                  }}
                >
                  <Download size={13} /> Download Template
                </button>
              </div>

              <div className="csv-dropzone" onClick={() => {
                setCsvText(
                  "studentEmail,studentName,courseCode,sectionName,semester,overridePrerequisites\n" +
                  "alex.mercer@scholarpulse.edu,Alex Mercer,CS301,Section A,FA26,false\n" +
                  "maya.lin@scholarpulse.edu,Maya Lin,CS401,Section A,FA26,false\n" +
                  "liam.vance@scholarpulse.edu,Liam Vance,MTH201,Section A,FA26,true\n" +
                  "sophia.clark@scholarpulse.edu,Sophia Clark,CS101,Section B,FA26,false"
                );
              }}>
                <FileSpreadsheet size={32} style={{ color: "var(--accent-primary)", margin: "0 auto 8px" }} />
                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  Click to populate demo CSV payload or paste below
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
                  Format: studentEmail, studentName, courseCode, sectionName, semester, overridePrerequisites
                </div>
              </div>

              <div className="form-group-custom">
                <textarea
                  className="form-control-custom"
                  rows={6}
                  style={{ fontFamily: "monospace", fontSize: "0.78rem" }}
                  placeholder="Paste CSV rows here..."
                  value={csvText}
                  onChange={e => setCsvText(e.target.value)}
                />
              </div>

              {csvImportResult && (
                <div style={{
                  background: "var(--bg-secondary)", border: "1px solid var(--border-primary)",
                  borderRadius: 10, padding: 14, fontSize: "0.82rem"
                }}>
                  <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                    Batch Processing Report:
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                    <div style={{ background: "var(--bg-card)", padding: 8, borderRadius: 6, textAlign: "center" }}>
                      <div style={{ color: "var(--text-tertiary)", fontSize: "0.72rem" }}>Processed</div>
                      <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{csvImportResult.totalProcessed}</div>
                    </div>
                    <div style={{ background: "rgba(16, 185, 129, 0.1)", padding: 8, borderRadius: 6, textAlign: "center" }}>
                      <div style={{ color: "#10b981", fontSize: "0.72rem" }}>Enrolled</div>
                      <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#10b981" }}>{csvImportResult.enrolledCount}</div>
                    </div>
                    <div style={{ background: "rgba(245, 158, 11, 0.1)", padding: 8, borderRadius: 6, textAlign: "center" }}>
                      <div style={{ color: "#f59e0b", fontSize: "0.72rem" }}>Waitlisted</div>
                      <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#f59e0b" }}>{csvImportResult.waitlistedCount}</div>
                    </div>
                    <div style={{ background: "rgba(239, 68, 68, 0.1)", padding: 8, borderRadius: 6, textAlign: "center" }}>
                      <div style={{ color: "#ef4444", fontSize: "0.72rem" }}>Errors</div>
                      <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#ef4444" }}>{csvImportResult.skippedCount}</div>
                    </div>
                  </div>

                  {csvImportResult.errors?.length > 0 && (
                    <div style={{ color: "#ef4444", fontSize: "0.75rem", maxHeight: 100, overflowY: "auto" }}>
                      {csvImportResult.errors.map((err: any, i: number) => (
                        <div key={i}>Row {err.row} ({err.email}): {err.error}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setShowCsvModal(false)}
                style={{
                  background: "var(--bg-card)", border: "1px solid var(--border-primary)",
                  padding: "8px 16px", borderRadius: 8, fontSize: "0.85rem", cursor: "pointer",
                  color: "var(--text-secondary)"
                }}
              >
                Close
              </button>
              <button
                onClick={handleExecuteCsvImport}
                disabled={csvImporting || !csvText.trim()}
                style={{
                  background: "var(--accent-primary)", color: "#fff", border: "none",
                  padding: "8px 20px", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                  opacity: csvImporting || !csvText.trim() ? 0.6 : 1
                }}
              >
                {csvImporting ? <RefreshCw className="animate-spin" size={15} /> : <Upload size={15} />}
                Execute Batch Enrollment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          MODAL: COURSE DETAILS & SYLLABUS
          ════════════════════════════════════════════════════════════ */}
      {selectedCourseForDetail && (
        <div className="modal-overlay">
          <div className="modal-content-card" style={{ maxWidth: 650 }}>
            <div className="modal-header">
              <div>
                <span style={{
                  fontSize: "0.75rem", fontWeight: 700, color: selectedCourseForDetail.color || "#6366f1",
                  background: `${selectedCourseForDetail.color || "#6366f1"}15`, padding: "2px 8px", borderRadius: 4
                }}>
                  {selectedCourseForDetail.code} • {selectedCourseForDetail.credits} Credits
                </span>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)", marginTop: 4, margin: 0 }}>
                  {selectedCourseForDetail.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCourseForDetail(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
                {selectedCourseForDetail.description || "Comprehensive academic course offerings and theoretical laboratory instruction."}
              </p>

              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
                background: "var(--bg-secondary)", borderRadius: 10, padding: 14, fontSize: "0.82rem"
              }}>
                <div><span style={{ color: "var(--text-tertiary)" }}>Department:</span> {selectedCourseForDetail.departmentName}</div>
                <div><span style={{ color: "var(--text-tertiary)" }}>Instructor:</span> {selectedCourseForDetail.instructor || "Assigned Faculty"}</div>
                <div><span style={{ color: "var(--text-tertiary)" }}>Schedule:</span> {selectedCourseForDetail.schedule || "TBA"}</div>
                <div><span style={{ color: "var(--text-tertiary)" }}>Room:</span> {selectedCourseForDetail.room || "TBA"}</div>
                <div><span style={{ color: "var(--text-tertiary)" }}>Enrollment:</span> {selectedCourseForDetail.enrolled} / {selectedCourseForDetail.capacity}</div>
                <div><span style={{ color: "var(--text-tertiary)" }}>Waitlisted:</span> {selectedCourseForDetail.waitlistCount || 0} students</div>
              </div>

              <div>
                <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                  Syllabus & Curriculum Outline
                </h4>
                <div style={{
                  background: "var(--bg-secondary)", borderRadius: 8, padding: 14,
                  fontSize: "0.82rem", whiteSpace: "pre-line", color: "var(--text-primary)", lineHeight: 1.6
                }}>
                  {selectedCourseForDetail.syllabus || "Course outline published during orientation week."}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setSelectedCourseForDetail(null)}
                style={{
                  background: "var(--accent-primary)", color: "#fff", border: "none",
                  padding: "8px 20px", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          MODAL: ADD DEPARTMENT
          ════════════════════════════════════════════════════════════ */}
      {showDeptModal && (
        <div className="modal-overlay">
          <div className="modal-content-card" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                Add New Department
              </h3>
              <button
                onClick={() => setShowDeptModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDepartment}>
              <div className="modal-body">
                <div className="form-group-custom">
                  <label>Department Code (e.g. CS, EE, MTH) *</label>
                  <input
                    className="form-control-custom"
                    placeholder="e.g. BIO"
                    value={deptFormData.code || ""}
                    onChange={e => setDeptFormData({ ...deptFormData, code: e.target.value.toUpperCase() })}
                    required
                  />
                </div>

                <div className="form-group-custom">
                  <label>Department Name *</label>
                  <input
                    className="form-control-custom"
                    placeholder="e.g. Biological Sciences & Bioengineering"
                    value={deptFormData.name || ""}
                    onChange={e => setDeptFormData({ ...deptFormData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group-custom">
                  <label>Head of Department</label>
                  <input
                    className="form-control-custom"
                    placeholder="e.g. Dr. John Watson"
                    value={deptFormData.headOfDepartment || ""}
                    onChange={e => setDeptFormData({ ...deptFormData, headOfDepartment: e.target.value })}
                  />
                </div>

                <div className="form-group-custom">
                  <label>Building / Location</label>
                  <input
                    className="form-control-custom"
                    placeholder="e.g. Watson Life Sciences Complex"
                    value={deptFormData.building || ""}
                    onChange={e => setDeptFormData({ ...deptFormData, building: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  style={{
                    background: "var(--bg-card)", border: "1px solid var(--border-primary)",
                    padding: "8px 16px", borderRadius: 8, fontSize: "0.85rem", cursor: "pointer",
                    color: "var(--text-secondary)"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: "var(--accent-primary)", color: "#fff", border: "none",
                    padding: "8px 18px", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          MODAL: ADD SECTION
          ════════════════════════════════════════════════════════════ */}
      {showSectionModal && (
        <div className="modal-overlay">
          <div className="modal-content-card" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                Add Course Section
              </h3>
              <button
                onClick={() => setShowSectionModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSection}>
              <div className="modal-body">
                <div className="form-group-custom">
                  <label>Course *</label>
                  <select
                    className="form-control-custom"
                    value={sectionFormData.courseId || ""}
                    onChange={e => setSectionFormData({ ...sectionFormData, courseId: e.target.value })}
                    required
                  >
                    <option value="">Select course...</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group-custom">
                  <label>Section Name *</label>
                  <input
                    className="form-control-custom"
                    placeholder="e.g. Section B - Afternoon"
                    value={sectionFormData.name || ""}
                    onChange={e => setSectionFormData({ ...sectionFormData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group-custom">
                  <label>Instructor Name</label>
                  <input
                    className="form-control-custom"
                    placeholder="e.g. Dr. Alex Rivera"
                    value={sectionFormData.instructorName || ""}
                    onChange={e => setSectionFormData({ ...sectionFormData, instructorName: e.target.value })}
                  />
                </div>

                <div className="form-group-custom">
                  <label>Capacity</label>
                  <input
                    className="form-control-custom"
                    type="number"
                    value={sectionFormData.capacity || 30}
                    onChange={e => setSectionFormData({ ...sectionFormData, capacity: Number(e.target.value) })}
                  />
                </div>

                <div className="form-group-custom">
                  <label>Schedule & Room</label>
                  <input
                    className="form-control-custom"
                    placeholder="e.g. TTh 13:00-14:30 | Room 204"
                    value={sectionFormData.schedule || ""}
                    onChange={e => setSectionFormData({ ...sectionFormData, schedule: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowSectionModal(false)}
                  style={{
                    background: "var(--bg-card)", border: "1px solid var(--border-primary)",
                    padding: "8px 16px", borderRadius: 8, fontSize: "0.85rem", cursor: "pointer",
                    color: "var(--text-secondary)"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: "var(--accent-primary)", color: "#fff", border: "none",
                    padding: "8px 18px", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Save Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
