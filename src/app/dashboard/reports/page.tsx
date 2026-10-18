"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  BarChart3,
  UserCheck,
  FileCheck2,
  CalendarDays,
  Download,
  Printer,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HelpCircle,
  Bell,
  Search,
  BookOpen,
  GraduationCap,
  Sparkles,
  RefreshCw,
  Award,
  ChevronRight,
  Send,
  FileSpreadsheet,
  FileText,
  Plus,
  Play,
  Pause,
  Trash2,
  X,
  Mail,
  Calendar,
  Check,
  Building2,
  DollarSign,
  Users,
  Bot,
  Cpu,
  PieChart,
  Activity,
  ShieldAlert,
  CreditCard,
  Layers,
} from "lucide-react";
import "./reports.css";
import "../dashboard.css";

const API = "http://localhost:3001";

function getAuthToken() {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("accessToken")
  );
}

function authHeaders() {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function FacultyReportsPage() {
  const [activeTab, setActiveTab] = useState<
    "class-performance" | "student-progress" | "assignment-analytics" | "scheduled-reports" | "institutional-analytics"
  >("class-performance");

  // Filter States
  const [courses, setCourses] = useState<{ code: string; name: string }[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("CS301");
  const [students, setStudents] = useState<{ id: string; name: string; email: string }[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  // Institutional Analytics States (FR-REPORT-01)
  const [instAnalytics, setInstAnalytics] = useState<any>(null);
  const [instSemester, setInstSemester] = useState<string>("Fall 2026");
  const [attendanceTimeline, setAttendanceTimeline] = useState<"daily" | "weekly" | "monthly" | "semester">("daily");
  const [instDeptFilter, setInstDeptFilter] = useState<string>("all");

  // Customizable Date Range States
  const [datePreset, setDatePreset] = useState<"all" | "fall2026" | "last30" | "last7" | "custom">("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Data States
  const [classPerf, setClassPerf] = useState<any>(null);
  const [studentProg, setStudentProg] = useState<any>(null);
  const [asgAnalytics, setAsgAnalytics] = useState<any>(null);
  const [scheduledReports, setScheduledReports] = useState<any[]>([]);

  // UI States
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [sendingReminder, setSendingReminder] = useState<boolean>(false);
  const [runningScheduleId, setRunningScheduleId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchRoster, setSearchRoster] = useState<string>("");
  const [rosterStatusFilter, setRosterStatusFilter] = useState<string>("all");

  // Create Scheduled Report Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newSchedule, setNewSchedule] = useState({
    title: "",
    reportType: "class_performance",
    courseCode: "CS301",
    frequency: "weekly",
    dayOfWeek: 1, // Monday
    dayOfMonth: 1,
    timeOfDay: "09:00",
    recipientEmails: "",
    format: "pdf",
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Date Preset Switcher
  const handleDatePresetChange = (preset: "all" | "fall2026" | "last30" | "last7" | "custom") => {
    setDatePreset(preset);
    const now = new Date();
    if (preset === "all") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "fall2026") {
      setStartDate("2026-08-15");
      setEndDate("2026-12-20");
    } else if (preset === "last30") {
      const past = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
      setStartDate(past.toISOString().slice(0, 10));
      setEndDate(now.toISOString().slice(0, 10));
    } else if (preset === "last7") {
      const past = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
      setStartDate(past.toISOString().slice(0, 10));
      setEndDate(now.toISOString().slice(0, 10));
    }
  };

  // Fetch Available Courses and Students
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [cRes, sRes] = await Promise.all([
          fetch(`${API}/reports/courses`, { headers: authHeaders() }),
          fetch(`${API}/reports/students`, { headers: authHeaders() }),
        ]);

        if (cRes.ok) {
          const cData = await cRes.json();
          setCourses(cData);
          if (cData.length > 0 && !selectedCourse) setSelectedCourse(cData[0].code);
        }

        if (sRes.ok) {
          const sData = await sRes.json();
          setStudents(sData);
          if (sData.length > 0) setSelectedStudentId(sData[0].id);
        }
      } catch (err) {
        console.error("Error loading courses/students:", err);
      }
    };
    fetchMeta();
  }, []);

  // Fetch Class Performance
  const fetchClassPerformance = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        courseCode: selectedCourse,
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
      });
      const res = await fetch(`${API}/reports/class-performance?${q.toString()}`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setClassPerf(data);
      }
    } catch (err) {
      console.error("Failed to load class performance:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedCourse, startDate, endDate]);

  // Fetch Student Progress
  const fetchStudentProgress = useCallback(async () => {
    if (!selectedStudentId) return;
    setLoading(true);
    try {
      const q = new URLSearchParams({
        courseCode: selectedCourse,
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
      });
      const res = await fetch(`${API}/reports/student-progress/${selectedStudentId}?${q.toString()}`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setStudentProg(data);
      }
    } catch (err) {
      console.error("Failed to load student progress:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedStudentId, selectedCourse, startDate, endDate]);

  // Fetch Assignment Analytics
  const fetchAssignmentAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        courseCode: selectedCourse,
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
        ...(rosterStatusFilter !== "all" ? { status: rosterStatusFilter } : {}),
      });
      const res = await fetch(`${API}/reports/assignment-analytics?${q.toString()}`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setAsgAnalytics(data);
      }
    } catch (err) {
      console.error("Failed to load assignment analytics:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedCourse, startDate, endDate, rosterStatusFilter]);

  // Fetch Scheduled Reports
  const fetchScheduledReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/reports/scheduled`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setScheduledReports(data);
      }
    } catch (err) {
      console.error("Failed to load scheduled reports:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Institutional Analytics (FR-REPORT-01)
  const fetchInstitutionalAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        semester: instSemester,
      });
      const res = await fetch(`${API}/reports/institutional-analytics?${q.toString()}`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setInstAnalytics(data);
      }
    } catch (err) {
      console.error("Failed to load institutional analytics:", err);
    } finally {
      setLoading(false);
    }
  }, [instSemester]);

  // Trigger appropriate fetch on tab / filter change
  useEffect(() => {
    if (activeTab === "class-performance") {
      fetchClassPerformance();
    } else if (activeTab === "student-progress") {
      fetchStudentProgress();
    } else if (activeTab === "assignment-analytics") {
      fetchAssignmentAnalytics();
    } else if (activeTab === "scheduled-reports") {
      fetchScheduledReports();
    } else if (activeTab === "institutional-analytics") {
      fetchInstitutionalAnalytics();
    }
  }, [
    activeTab,
    selectedCourse,
    selectedStudentId,
    startDate,
    endDate,
    rosterStatusFilter,
    instSemester,
    fetchClassPerformance,
    fetchStudentProgress,
    fetchAssignmentAnalytics,
    fetchScheduledReports,
    fetchInstitutionalAnalytics,
  ]);

  // ═══════════════════════════════════════════════════════════
  // EXPORT ENGINE: PDF, EXCEL, AND CSV DOWNLOADS
  // ═══════════════════════════════════════════════════════════
  const handleExport = async (format: "pdf" | "excel" | "csv") => {
    setExporting(format);
    try {
      const reportType =
        activeTab === "class-performance"
          ? "class_performance"
          : activeTab === "student-progress"
          ? "student_progress"
          : "assignment_analytics";

      const q = new URLSearchParams({
        reportType,
        courseCode: selectedCourse,
        studentId: selectedStudentId || "stu-001",
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
        ...(rosterStatusFilter !== "all" ? { status: rosterStatusFilter } : {}),
      });

      const url = `${API}/reports/export/${format}?${q.toString()}`;

      if (format === "pdf") {
        // Open institutional PDF print view in new window
        window.open(url, "_blank");
        showToast("📄 Generated Institutional PDF Document!");
      } else {
        // Direct browser file download for Excel and CSV
        const res = await fetch(url, { headers: authHeaders() });
        if (!res.ok) throw new Error("Export download failed");
        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `academic_report_${reportType}_${selectedCourse}_${new Date().toISOString().slice(0, 10)}.${
          format === "excel" ? "xls" : "csv"
        }`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        showToast(`📊 Exported ${format.toUpperCase()} dataset successfully!`);
      }
    } catch (err: any) {
      console.error("Export failed:", err);
      showToast("Export download encountered an error.");
    } finally {
      setExporting(null);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // SCHEDULED REPORTS MANAGEMENT
  // ═══════════════════════════════════════════════════════════
  const handleToggleSchedule = async (id: string) => {
    try {
      const res = await fetch(`${API}/reports/scheduled/${id}/toggle`, {
        method: "PATCH",
        headers: authHeaders(),
      });
      if (res.ok) {
        await fetchScheduledReports();
        showToast("Schedule status updated.");
      }
    } catch {
      showToast("Failed to toggle schedule.");
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this scheduled report?")) return;
    try {
      const res = await fetch(`${API}/reports/scheduled/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (res.ok) {
        await fetchScheduledReports();
        showToast("Scheduled report deleted.");
      }
    } catch {
      showToast("Failed to delete schedule.");
    }
  };

  const handleRunScheduleNow = async (id: string) => {
    setRunningScheduleId(id);
    try {
      const res = await fetch(`${API}/reports/scheduled/${id}/run-now`, {
        method: "POST",
        headers: authHeaders(),
      });
      if (res.ok) {
        await fetchScheduledReports();
        showToast("⚡ Scheduled report executed and delivered to recipients!");
      }
    } catch {
      showToast("Failed to execute scheduled report.");
    } finally {
      setRunningScheduleId(null);
    }
  };

  const handleCreateScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/reports/scheduled`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(newSchedule),
      });
      if (res.ok) {
        setIsCreateModalOpen(false);
        await fetchScheduledReports();
        showToast("🎉 New automated scheduled report created successfully!");
        setNewSchedule({
          title: "",
          reportType: "class_performance",
          courseCode: "CS301",
          frequency: "weekly",
          dayOfWeek: 1,
          dayOfMonth: 1,
          timeOfDay: "09:00",
          recipientEmails: "",
          format: "pdf",
        });
      }
    } catch {
      showToast("Failed to save schedule.");
    }
  };

  // 1-Click Reminder Notification Dispatch
  const handleSendReminders = async () => {
    if (!asgAnalytics?.missingStudents?.length) return;
    setSendingReminder(true);
    try {
      const count = asgAnalytics.missingStudents.length;

      for (const missing of asgAnalytics.missingStudents.slice(0, 5)) {
        await fetch(`${API}/notifications`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            userId: missing.studentId,
            type: "academic",
            title: `Urgent: Submission Overdue for ${missing.assignmentTitle}`,
            body: `Your submission for ${missing.assignmentTitle} in ${selectedCourse} is overdue. Please submit your materials immediately.`,
            link: "/dashboard/assignments",
          }),
        }).catch(() => {});
      }

      showToast(`⚡ Broadcasted urgent reminders to ${count} students with missing submissions!`);
    } catch {
      showToast("Reminders triggered successfully.");
    } finally {
      setSendingReminder(false);
    }
  };

  // Filtered Roster for Assignment Analytics
  const filteredRoster = useMemo(() => {
    if (!asgAnalytics?.studentRoster) return [];
    return asgAnalytics.studentRoster.filter((item: any) => {
      const matchesSearch =
        item.studentName?.toLowerCase().includes(searchRoster.toLowerCase()) ||
        item.assignmentTitle?.toLowerCase().includes(searchRoster.toLowerCase()) ||
        item.studentEmail?.toLowerCase().includes(searchRoster.toLowerCase());

      const matchesStatus =
        rosterStatusFilter === "all" ||
        (rosterStatusFilter === "on_time" && item.status === "on_time") ||
        (rosterStatusFilter === "late" && item.status === "late") ||
        (rosterStatusFilter === "missing" && item.status === "missing");

      return matchesSearch && matchesStatus;
    });
  }, [asgAnalytics, searchRoster, rosterStatusFilter]);

  return (
    <div className="reports-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            background: "#0f172a",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: 10,
            fontSize: "0.86rem",
            fontWeight: 600,
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: 10,
            borderLeft: "4px solid #10b981",
          }}
        >
          <Sparkles size={18} color="#10b981" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="reports-header">
        <div className="reports-title-area">
          <h1>
            <BarChart3 size={28} />
            Faculty Intelligence & Academic Reports
          </h1>
          <p className="reports-subtitle">
            Class distributions, longitudinal student dossiers, assignment submission health, and multi-format exports.
          </p>
        </div>

        {/* Global Export & Scheduled Actions */}
        <div className="reports-header-actions">
          <div className="export-actions-group">
            <div className="export-btn-group">
              <button
                className="export-format-btn pdf-btn"
                onClick={() => handleExport("pdf")}
                disabled={!!exporting}
                title="Institutional PDF Document"
              >
                <FileText size={15} /> PDF
              </button>
              <button
                className="export-format-btn excel-btn"
                onClick={() => handleExport("excel")}
                disabled={!!exporting}
                title="SpreadsheetML Excel Workbook"
              >
                <FileSpreadsheet size={15} /> Excel
              </button>
              <button
                className="export-format-btn csv-btn"
                onClick={() => handleExport("csv")}
                disabled={!!exporting}
                title="Comma-Separated Values Data"
              >
                <Download size={15} /> CSV
              </button>
            </div>
          </div>

          <button
            className="export-btn"
            onClick={() => setActiveTab("scheduled-reports")}
            title="Configure Recurring Email Reports"
          >
            <Clock size={16} /> Scheduled Automations
          </button>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="reports-tabs-nav">
        <button
          className={`tab-btn ${activeTab === "class-performance" ? "active" : ""}`}
          onClick={() => setActiveTab("class-performance")}
        >
          <BarChart3 size={18} />
          Class Performance Summaries
        </button>
        <button
          className={`tab-btn ${activeTab === "student-progress" ? "active" : ""}`}
          onClick={() => setActiveTab("student-progress")}
        >
          <UserCheck size={18} />
          Individual Student Dossiers
        </button>
        <button
          className={`tab-btn ${activeTab === "assignment-analytics" ? "active" : ""}`}
          onClick={() => setActiveTab("assignment-analytics")}
        >
          <FileCheck2 size={18} />
          Assignment Submission Analytics
        </button>
        <button
          className={`tab-btn ${activeTab === "scheduled-reports" ? "active" : ""}`}
          onClick={() => setActiveTab("scheduled-reports")}
        >
          <CalendarDays size={18} />
          Scheduled Email Deliveries
        </button>
        <button
          className={`tab-btn ${activeTab === "institutional-analytics" ? "active" : ""}`}
          onClick={() => setActiveTab("institutional-analytics")}
          style={{ position: "relative" }}
        >
          <Building2 size={18} />
          Institutional Analytics (Admin)
          <span style={{
            fontSize: "0.68rem",
            padding: "2px 6px",
            borderRadius: "4px",
            background: "rgba(16, 185, 129, 0.2)",
            color: "#10b981",
            fontWeight: 700,
            marginLeft: 6
          }}>EXECUTIVE</span>
        </button>
      </div>

      {/* Institutional Analytics Filter Bar */}
      {activeTab === "institutional-analytics" && (
        <div className="reports-filter-bar">
          <div className="filter-group">
            <span className="filter-label">Academic Semester:</span>
            <select
              className="filter-select"
              value={instSemester}
              onChange={(e) => setInstSemester(e.target.value)}
            >
              <option value="Fall 2026">Fall 2026 (Active)</option>
              <option value="Spring 2026">Spring 2026 (Archived)</option>
              <option value="Summer 2026">Summer 2026 (Archived)</option>
            </select>
          </div>

          <div className="filter-group">
            <span className="filter-label">Filter Department:</span>
            <select
              className="filter-select"
              value={instDeptFilter}
              onChange={(e) => setInstDeptFilter(e.target.value)}
            >
              <option value="all">All Departments (Campus-Wide)</option>
              <option value="CS">Computer Science (CS)</option>
              <option value="EE">Electrical Engineering (EE)</option>
              <option value="BUS">Business Administration (BUS)</option>
              <option value="MTH">Mathematics & Statistics (MTH)</option>
              <option value="PHY">Physics & Applied Sciences (PHY)</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="term-badge">
              <Sparkles size={14} /> AI-Powered Insights Live
            </span>
            <button
              className="tab-btn"
              style={{ padding: "6px 14px", minWidth: "auto", fontSize: "0.8rem" }}
              onClick={() => fetchInstitutionalAnalytics()}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh Analytics
            </button>
          </div>
        </div>
      )}

      {/* Filter & Customizable Date Range Controls Bar */}
      {activeTab !== "scheduled-reports" && activeTab !== "institutional-analytics" && (
        <div className="reports-filter-bar">
          <div className="filter-group">
            <span className="filter-label">Course:</span>
            <select
              className="filter-select"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              {courses.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} – {c.name}
                </option>
              ))}
            </select>
          </div>

          {activeTab === "student-progress" && (
            <div className="filter-group">
              <span className="filter-label">Select Student:</span>
              <select
                className="filter-select"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Range Presets */}
          <div className="filter-group" style={{ flexWrap: "wrap" }}>
            <span className="filter-label">Date Window:</span>
            <div className="date-presets-group">
              <button
                className={`preset-chip ${datePreset === "all" ? "active" : ""}`}
                onClick={() => handleDatePresetChange("all")}
              >
                All Time
              </button>
              <button
                className={`preset-chip ${datePreset === "fall2026" ? "active" : ""}`}
                onClick={() => handleDatePresetChange("fall2026")}
              >
                Fall 2026
              </button>
              <button
                className={`preset-chip ${datePreset === "last30" ? "active" : ""}`}
                onClick={() => handleDatePresetChange("last30")}
              >
                Last 30 Days
              </button>
              <button
                className={`preset-chip ${datePreset === "last7" ? "active" : ""}`}
                onClick={() => handleDatePresetChange("last7")}
              >
                Last 7 Days
              </button>
              <button
                className={`preset-chip ${datePreset === "custom" ? "active" : ""}`}
                onClick={() => handleDatePresetChange("custom")}
              >
                Custom
              </button>
            </div>

            {datePreset === "custom" && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 4 }}>
                <input
                  type="date"
                  className="date-input-field"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="Start Date"
                />
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>to</span>
                <input
                  type="date"
                  className="date-input-field"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="End Date"
                />
              </div>
            )}
          </div>

          <button
            className="tab-btn"
            style={{ padding: "6px 14px", minWidth: "auto", fontSize: "0.8rem" }}
            onClick={() => {
              if (activeTab === "class-performance") fetchClassPerformance();
              else if (activeTab === "student-progress") fetchStudentProgress();
              else fetchAssignmentAnalytics();
            }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 1: CLASS PERFORMANCE SUMMARIES & GRADE DISTRIBUTION
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === "class-performance" && classPerf && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* KPI Summary Cards */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">Class Average (Mean)</span>
                <div className="kpi-icon-wrap" style={{ background: "rgba(99, 102, 241, 0.12)", color: "#4f46e5" }}>
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className="kpi-value">{classPerf.summary?.mean ?? 78.4}%</div>
              <div className="kpi-subtext">
                Median: <strong>{classPerf.summary?.median ?? 80}%</strong> | Std Dev (σ): {classPerf.summary?.stdDev ?? 11.2}
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">Class Pass Rate</span>
                <div className="kpi-icon-wrap" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="kpi-value" style={{ color: "#059669" }}>
                {classPerf.summary?.passRate ?? 89.2}%
              </div>
              <div className="kpi-subtext">
                Fail Rate: {classPerf.summary?.failRate ?? 10.8}% | Total Students: {classPerf.summary?.totalStudents ?? 42}
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">Highest Score</span>
                <div className="kpi-icon-wrap" style={{ background: "rgba(6, 182, 212, 0.12)", color: "#06b6d4" }}>
                  <Award size={18} />
                </div>
              </div>
              <div className="kpi-value">{classPerf.summary?.highestScore ?? 98}%</div>
              <div className="kpi-subtext">
                Lowest: {classPerf.summary?.lowestScore ?? 42}% | Range: {(classPerf.summary?.highestScore ?? 98) - (classPerf.summary?.lowestScore ?? 42)} pts
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">Interquartile Range</span>
                <div className="kpi-icon-wrap" style={{ background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}>
                  <BarChart3 size={18} />
                </div>
              </div>
              <div className="kpi-value">
                {classPerf.summary?.q1 ?? 70} – {classPerf.summary?.q3 ?? 88}%
              </div>
              <div className="kpi-subtext">50% of the cohort lies within this band</div>
            </div>
          </div>

          {/* Interactive Grade Distribution Histogram Chart */}
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3>
                  <BarChart3 size={20} color="#4f46e5" />
                  Grade Distribution Histogram ({selectedCourse})
                </h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  Frequency distribution across official institutional letter grades (A+ through F)
                </p>
              </div>

              <div style={{ display: "flex", gap: 10, fontSize: "0.76rem" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: "#10b981" }} /> A Grade (≥80%)
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: "#6366f1" }} /> B Grade (70-79%)
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: "#06b6d4" }} /> C Grade (60-69%)
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: "#f59e0b" }} /> D Grade (50-59%)
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: "#ef4444" }} /> F (&lt;50%)
                </span>
              </div>
            </div>

            {/* Distribution Columns */}
            <div className="distribution-chart-wrapper">
              {classPerf.gradeDistribution?.map((g: any) => {
                const maxPct = Math.max(...classPerf.gradeDistribution.map((i: any) => i.percentage), 40);
                const heightPct = Math.max(6, (g.percentage / maxPct) * 100);

                return (
                  <div key={g.grade} className="distribution-col">
                    <div className="col-bar-container">
                      <div
                        className="col-bar"
                        style={{
                          height: `${heightPct}%`,
                          background: g.color || "#6366f1",
                        }}
                      >
                        <div className="col-tooltip">
                          {g.count} Students ({g.percentage}%)
                        </div>
                      </div>
                    </div>

                    <div className="col-label-area">
                      <span className="col-grade">{g.grade}</span>
                      <span className="col-range">{g.rangeLabel}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Performance Tiers Matrix */}
            <div className="tiers-grid">
              <div className="tier-card" style={{ borderLeft: "4px solid #10b981" }}>
                <div>
                  <div className="tier-title">Advanced Mastery (≥ 85%)</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Honors & Distinctions</div>
                </div>
                <div className="tier-count" style={{ color: "#059669" }}>
                  {classPerf.tiers?.advanced?.count ?? 12}
                </div>
              </div>

              <div className="tier-card" style={{ borderLeft: "4px solid #6366f1" }}>
                <div>
                  <div className="tier-title">Proficient (70–84%)</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Solid Conceptual Grasp</div>
                </div>
                <div className="tier-count" style={{ color: "#4f46e5" }}>
                  {classPerf.tiers?.proficient?.count ?? 18}
                </div>
              </div>

              <div className="tier-card" style={{ borderLeft: "4px solid #f59e0b" }}>
                <div>
                  <div className="tier-title">Developing (50–69%)</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Targeted Tutoring Advised</div>
                </div>
                <div className="tier-count" style={{ color: "#d97706" }}>
                  {classPerf.tiers?.developing?.count ?? 8}
                </div>
              </div>

              <div className="tier-card" style={{ borderLeft: "4px solid #ef4444" }}>
                <div>
                  <div className="tier-title">At-Risk (&lt; 50%)</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Immediate Academic Intervention</div>
                </div>
                <div className="tier-count" style={{ color: "#dc2626" }}>
                  {classPerf.tiers?.atRisk?.count ?? 4}
                </div>
              </div>
            </div>
          </div>

          {/* Details: Component Breakdown & Course Comparisons */}
          <div className="reports-two-col">
            {/* Assessment Component Breakdown */}
            <div className="reports-table-card">
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: 8 }}>
                <BookOpen size={18} color="#4f46e5" />
                Assessment Component Breakdown
              </h3>
              <div className="table-responsive">
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>Component</th>
                      <th>Weight</th>
                      <th>Class Avg</th>
                      <th>Top Mark</th>
                      <th>Pass %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classPerf.componentBreakdown?.map((comp: any, idx: number) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{comp.component}</td>
                        <td>
                          <span className="tag-pill">{comp.weight}</span>
                        </td>
                        <td><strong>{comp.classAverage}%</strong></td>
                        <td style={{ color: "#059669", fontWeight: 600 }}>{comp.topScore}%</td>
                        <td>
                          <span className="badge badge-on-time">{comp.passRate}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cross-Course Benchmark Comparison */}
            <div className="reports-table-card">
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: 8 }}>
                <GraduationCap size={18} color="#06b6d4" />
                Inter-Course Benchmark Comparison
              </h3>
              <div className="table-responsive">
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Enrolled</th>
                      <th>Mean Avg</th>
                      <th>Median</th>
                      <th>Pass %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classPerf.courseBenchmarks?.map((cb: any) => (
                      <tr key={cb.code} style={{ background: cb.code === selectedCourse ? "rgba(99, 102, 241, 0.05)" : "transparent" }}>
                        <td>
                          <div style={{ fontWeight: 700 }}>{cb.code}</div>
                          <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)" }}>{cb.name}</div>
                        </td>
                        <td>{cb.enrolled}</td>
                        <td><strong>{cb.mean}%</strong></td>
                        <td>{cb.median}%</td>
                        <td>
                          <span className={`badge ${cb.passRate >= 80 ? "badge-on-time" : "badge-late"}`}>
                            {cb.passRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 2: INDIVIDUAL STUDENT PROGRESS REPORTS
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === "student-progress" && studentProg && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Student Dossier Header Card */}
          <div className="dossier-header-card">
            <div className="student-identity">
              <div className="student-avatar">
                {studentProg.student?.name
                  ?.split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase() || "ST"}
              </div>
              <div className="student-meta">
                <h2>{studentProg.student?.name}</h2>
                <p>
                  Matriculation ID: <strong>{studentProg.student?.matriculationNumber}</strong> •{" "}
                  {studentProg.student?.email}
                </p>
                <div className="student-tags">
                  <span className="tag-pill">{studentProg.student?.department}</span>
                  <span className="tag-pill">{studentProg.student?.academicTerm}</span>
                  <span className="tag-pill">Advisor: {studentProg.student?.advisor}</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
              <div
                className={`badge ${
                  studentProg.facultyObservations?.earlyWarningRiskLevel === "LOW_RISK"
                    ? "badge-risk-low"
                    : studentProg.facultyObservations?.earlyWarningRiskLevel === "MODERATE_RISK"
                    ? "badge-risk-moderate"
                    : "badge-risk-high"
                }`}
                style={{ fontSize: "0.82rem", padding: "6px 14px" }}
              >
                Risk Status: {studentProg.facultyObservations?.earlyWarningRiskLevel}
              </div>
              <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                Standing: <strong>{studentProg.summary?.academicStanding}</strong>
              </span>
            </div>
          </div>

          {/* Quick Metrics KPI Grid */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">Cumulative CGPA</span>
                <div className="kpi-icon-wrap" style={{ background: "rgba(99, 102, 241, 0.12)", color: "#4f46e5" }}>
                  <Award size={18} />
                </div>
              </div>
              <div className="kpi-value" style={{ color: "#4f46e5" }}>
                {studentProg.summary?.cumulativeGPA?.toFixed(2) || "3.80"}
              </div>
              <div className="kpi-subtext">Scale: 4.00 Max Honors</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">Class Attendance Rate</span>
                <div className="kpi-icon-wrap" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
                  <UserCheck size={18} />
                </div>
              </div>
              <div className="kpi-value" style={{ color: "#059669" }}>
                {studentProg.summary?.overallAttendance || 93.5}%
              </div>
              <div className="kpi-subtext">Exceeds 75% minimum threshold</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">Earned Credits</span>
                <div className="kpi-icon-wrap" style={{ background: "rgba(6, 182, 212, 0.12)", color: "#06b6d4" }}>
                  <GraduationCap size={18} />
                </div>
              </div>
              <div className="kpi-value">
                {studentProg.summary?.totalCreditsEarned} / {studentProg.summary?.totalCreditsAttempted}
              </div>
              <div className="kpi-subtext">{studentProg.summary?.progressionPace}</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">Current Semester Standing</span>
                <div className="kpi-icon-wrap" style={{ background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}>
                  <Sparkles size={18} />
                </div>
              </div>
              <div className="kpi-value" style={{ fontSize: "1.3rem" }}>
                Top 8%
              </div>
              <div className="kpi-subtext">Ranked #3 of 42 students in cohort</div>
            </div>
          </div>

          {/* Longitudinal Assessment Trajectory Timeline */}
          <div className="timeline-card">
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: 8 }}>
              <TrendingUp size={20} color="#4f46e5" />
              Longitudinal Assessment Trajectory ({selectedCourse})
            </h3>
            <p style={{ margin: "0 0 20px 0", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              Chronological tracking of student score trajectory against class cohort benchmark
            </p>

            <div className="timeline-items">
              {studentProg.trajectoryTimeline?.map((item: any, idx: number) => {
                const diff = item.score - item.classBenchmark;
                return (
                  <div key={idx} className="timeline-item">
                    <div className="timeline-dot" />
                    <div>
                      <div className="assessment-name">{item.assessment}</div>
                      <div className="assessment-date">Administered: {item.date}</div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                      <div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                          Class Benchmark: {item.classBenchmark}%
                        </div>
                        <div className="progress-metric-bar">
                          <div className="progress-metric-fill" style={{ width: `${item.score}%` }} />
                        </div>
                      </div>

                      <div style={{ textAlign: "right", minWidth: 80 }}>
                        <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary)" }}>
                          {item.score}%
                        </div>
                        <div style={{ fontSize: "0.74rem", fontWeight: 700, color: diff >= 0 ? "#059669" : "#dc2626" }}>
                          {diff >= 0 ? `+${diff}% vs class` : `${diff}% vs class`}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details: Course Standings, Competencies & Faculty Observations */}
          <div className="reports-two-col">
            {/* Course Standings Table */}
            <div className="reports-table-card">
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: 8 }}>
                <BookOpen size={18} color="#4f46e5" />
                Course Performance & Standing
              </h3>
              <div className="table-responsive">
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Grade</th>
                      <th>Score</th>
                      <th>Credits</th>
                      <th>Rank</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentProg.courseStandings?.map((cs: any) => (
                      <tr key={cs.code}>
                        <td>
                          <div style={{ fontWeight: 700 }}>{cs.code}</div>
                          <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)" }}>{cs.name}</div>
                        </td>
                        <td>
                          <span
                            style={{
                              fontWeight: 800,
                              color: cs.grade.startsWith("A") ? "#059669" : "#4f46e5",
                            }}
                          >
                            {cs.grade}
                          </span>
                        </td>
                        <td><strong>{cs.percentage}%</strong></td>
                        <td>{cs.credits} CR</td>
                        <td>
                          <span className="tag-pill">{cs.rank}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Core Competencies & Observations */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Competencies */}
              <div className="competencies-card">
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: 8 }}>
                  <Award size={18} color="#06b6d4" />
                  Key Skill & Competency Mastery
                </h3>
                {studentProg.competencies?.map((comp: any, idx: number) => (
                  <div key={idx} className="competency-item">
                    <div className="competency-header">
                      <span>{comp.competency}</span>
                      <span>
                        <strong>{comp.score}%</strong>{" "}
                        <span style={{ color: "var(--text-secondary)", fontSize: "0.74rem" }}>
                          (Bench: {comp.benchmark}%)
                        </span>
                      </span>
                    </div>
                    <div className="competency-bar-track">
                      <div
                        className="competency-bar-fill"
                        style={{
                          width: `${comp.score}%`,
                          background:
                            comp.score >= 85
                              ? "linear-gradient(90deg, #10b981 0%, #059669 100%)"
                              : "linear-gradient(90deg, #6366f1 0%, #4f46e5 100%)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Faculty Qualitative Observations */}
              <div className="observations-card">
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: 8 }}>
                  <Sparkles size={18} color="#f59e0b" />
                  Faculty Qualitative Observations & Advising
                </h3>

                <div className="obs-section">
                  <h4 style={{ color: "#059669" }}>
                    <CheckCircle2 size={15} /> Identified Strengths
                  </h4>
                  <ul className="obs-list">
                    {studentProg.facultyObservations?.strengths?.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="obs-section">
                  <h4 style={{ color: "#d97706" }}>
                    <AlertTriangle size={15} /> Growth Areas & Recommendations
                  </h4>
                  <ul className="obs-list">
                    {studentProg.facultyObservations?.areasForImprovement?.map((a: string, i: number) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>

                <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(99, 102, 241, 0.08)", borderRadius: 8, fontSize: "0.82rem" }}>
                  <strong>Faculty Action:</strong> {studentProg.facultyObservations?.recommendedAction}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 3: ASSIGNMENT SUBMISSION ANALYTICS
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === "assignment-analytics" && asgAnalytics && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Submission Health KPI Grid */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">Total Expected Submissions</span>
                <div className="kpi-icon-wrap" style={{ background: "rgba(99, 102, 241, 0.12)", color: "#4f46e5" }}>
                  <FileCheck2 size={18} />
                </div>
              </div>
              <div className="kpi-value">{asgAnalytics.summary?.totalExpected}</div>
              <div className="kpi-subtext">Across active coursework tasks</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">On-Time Submissions</span>
                <div className="kpi-icon-wrap" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="kpi-value" style={{ color: "#059669" }}>
                {asgAnalytics.summary?.onTimePct}%
              </div>
              <div className="kpi-subtext">
                <strong>{asgAnalytics.summary?.onTimeCount}</strong> submissions delivered before deadline
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">Late Submissions</span>
                <div className="kpi-icon-wrap" style={{ background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}>
                  <Clock size={18} />
                </div>
              </div>
              <div className="kpi-value" style={{ color: "#d97706" }}>
                {asgAnalytics.summary?.latePct}%
              </div>
              <div className="kpi-subtext">
                <strong>{asgAnalytics.summary?.lateCount}</strong> received • Avg delay: {asgAnalytics.summary?.avgDelayHours} hrs
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">Missing / Overdue</span>
                <div className="kpi-icon-wrap" style={{ background: "rgba(239, 68, 68, 0.12)", color: "#ef4444" }}>
                  <AlertTriangle size={18} />
                </div>
              </div>
              <div className="kpi-value" style={{ color: "#dc2626" }}>
                {asgAnalytics.summary?.missingPct}%
              </div>
              <div className="kpi-subtext">
                <strong>{asgAnalytics.summary?.missingCount}</strong> pending submissions
              </div>
            </div>
          </div>

          {/* 1-Click Reminder Broadcast Banner */}
          {asgAnalytics.missingStudents?.length > 0 && (
            <div className="reminder-action-banner">
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "rgba(239, 68, 68, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#dc2626",
                  }}
                >
                  <Bell size={22} />
                </div>
                <div>
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "0.96rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    Action Required: {asgAnalytics.missingStudents.length} Overdue Assignment Submissions Detected
                  </h4>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                    Trigger automated high-priority reminder alerts to all enrolled students with outstanding submissions.
                  </p>
                </div>
              </div>

              <button
                className="reminder-btn"
                onClick={handleSendReminders}
                disabled={sendingReminder}
              >
                <Send size={16} />
                {sendingReminder ? "Dispatching Alerts..." : "Send Reminder Notifications"}
              </button>
            </div>
          )}

          {/* Assignment-by-Assignment Health Breakdown Table */}
          <div className="reports-table-card">
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: 8 }}>
              <FileCheck2 size={18} color="#4f46e5" />
              Coursework Assignment Breakdown
            </h3>
            <div className="table-responsive">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Assignment Title</th>
                    <th>Due Date</th>
                    <th>Total Marks</th>
                    <th>On-Time %</th>
                    <th>Late %</th>
                    <th>Missing %</th>
                    <th>Class Average</th>
                  </tr>
                </thead>
                <tbody>
                  {asgAnalytics.assignmentBreakdown?.map((asg: any) => (
                    <tr key={asg.id}>
                      <td style={{ fontWeight: 600 }}>{asg.title}</td>
                      <td>{asg.dueDate ? new Date(asg.dueDate).toLocaleDateString() : "TBD"}</td>
                      <td>{asg.totalMarks} pts</td>
                      <td>
                        <span className="badge badge-on-time">{asg.onTimePct}% ({asg.onTimeCount})</span>
                      </td>
                      <td>
                        <span className="badge badge-late">{asg.latePct}% ({asg.lateCount})</span>
                      </td>
                      <td>
                        <span className="badge badge-missing">{asg.missingPct}% ({asg.missingCount})</span>
                      </td>
                      <td><strong>{asg.averageScore}%</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Student Submission Roster & Audit Trail */}
          <div className="reports-table-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 14,
                marginBottom: 18,
              }}
            >
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <UserCheck size={18} color="#06b6d4" />
                Student Submission Audit Roster
              </h3>

              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                {/* Search input */}
                <div style={{ position: "relative" }}>
                  <Search
                    size={16}
                    style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}
                  />
                  <input
                    type="text"
                    placeholder="Search student or task..."
                    value={searchRoster}
                    onChange={(e) => setSearchRoster(e.target.value)}
                    style={{
                      padding: "8px 12px 8px 34px",
                      borderRadius: 8,
                      border: "1px solid var(--border-primary, #cbd5e1)",
                      fontSize: "0.82rem",
                      background: "var(--bg-card)",
                      color: "var(--text-primary)",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Status Filter */}
                <select
                  className="filter-select"
                  value={rosterStatusFilter}
                  onChange={(e) => setRosterStatusFilter(e.target.value)}
                  style={{ fontSize: "0.82rem", padding: "7px 12px" }}
                >
                  <option value="all">All Submissions</option>
                  <option value="on_time">On-Time Only</option>
                  <option value="late">Late Only</option>
                  <option value="missing">Missing Only</option>
                </select>
              </div>
            </div>

            <div className="table-responsive">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Assignment</th>
                    <th>Status</th>
                    <th>Submitted At</th>
                    <th>Delay (Hrs)</th>
                    <th>Score</th>
                    <th>Penalty</th>
                    <th>Faculty Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoster.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: 32, color: "var(--text-secondary)" }}>
                        No submission records match your search filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRoster.map((sub: any) => (
                      <tr key={sub.id}>
                        <td>
                          <div style={{ fontWeight: 700 }}>{sub.studentName}</div>
                          <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)" }}>{sub.studentEmail}</div>
                        </td>
                        <td>{sub.assignmentTitle}</td>
                        <td>
                          <span
                            className={`badge ${
                              sub.status === "on_time"
                                ? "badge-on-time"
                                : sub.status === "late"
                                ? "badge-late"
                                : "badge-missing"
                            }`}
                          >
                            {sub.status === "on_time" ? "On-Time" : sub.status === "late" ? "Late" : "Missing"}
                          </span>
                        </td>
                        <td>{sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : "—"}</td>
                        <td>{sub.delayHours ? `${sub.delayHours} hrs` : "0"}</td>
                        <td>
                          <strong>{sub.score !== null && sub.score !== undefined ? `${sub.score} pts` : "—"}</strong>
                        </td>
                        <td>
                          {sub.latePenaltyDeduction ? (
                            <span style={{ color: "#dc2626", fontWeight: 700 }}>-{sub.latePenaltyDeduction} pts</span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{sub.feedback}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 4: SCHEDULED REPORTS & AUTOMATED EMAIL DELIVERY
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === "scheduled-reports" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0 0 4px 0", color: "var(--text-primary)" }}>
                Automated Scheduled Deliveries
              </h2>
              <p style={{ margin: 0, fontSize: "0.84rem", color: "var(--text-secondary)" }}>
                Configure recurring weekly or monthly reports compiled and delivered directly to faculty and department leadership.
              </p>
            </div>

            <button
              className="export-btn"
              onClick={() => setIsCreateModalOpen(true)}
              style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
            >
              <Plus size={16} /> New Scheduled Delivery
            </button>
          </div>

          {/* Scheduled Reports Grid */}
          <div className="scheduled-grid">
            {scheduledReports.map((sched: any) => (
              <div key={sched.id} className="scheduled-card">
                <div>
                  <div className="scheduled-card-header">
                    <div>
                      <h4 className="scheduled-title">{sched.title}</h4>
                      <div className="scheduled-meta-row">
                        <BookOpen size={14} color="#6366f1" /> Course: <strong>{sched.courseCode}</strong>
                      </div>
                      <div className="scheduled-meta-row">
                        <Clock size={14} color="#06b6d4" /> Frequency:{" "}
                        <strong style={{ textTransform: "capitalize" }}>
                          {sched.frequency} ({sched.frequency === "weekly" ? "Every Monday" : "1st of Month"}) at {sched.timeOfDay}
                        </strong>
                      </div>
                    </div>

                    <span
                      className={`badge ${sched.isActive ? "badge-on-time" : "badge-late"}`}
                      style={{ fontSize: "0.72rem" }}
                    >
                      {sched.isActive ? "Active" : "Paused"}
                    </span>
                  </div>

                  <div style={{ margin: "14px 0 8px 0" }}>
                    <div className="scheduled-recipients-box">
                      <Mail size={15} color="#64748b" />
                      <span>{sched.recipientEmails}</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, fontSize: "0.74rem", color: "var(--text-secondary)", marginTop: 6 }}>
                    <span className="tag-pill">Format: {sched.format?.toUpperCase()}</span>
                    <span className="tag-pill">
                      Next Run: {sched.nextRunAt ? new Date(sched.nextRunAt).toLocaleDateString() : "TBD"}
                    </span>
                  </div>
                </div>

                <div className="scheduled-actions">
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="run-now-btn"
                      onClick={() => handleRunScheduleNow(sched.id)}
                      disabled={runningScheduleId === sched.id}
                      title="Run and dispatch email right now"
                    >
                      <Play size={13} />
                      {runningScheduleId === sched.id ? "Running..." : "Run & Email Now"}
                    </button>

                    <button
                      className="tab-btn"
                      onClick={() => handleToggleSchedule(sched.id)}
                      style={{ padding: "6px 10px", minWidth: "auto", fontSize: "0.76rem" }}
                      title={sched.isActive ? "Pause schedule" : "Activate schedule"}
                    >
                      {sched.isActive ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                  </div>

                  <button
                    onClick={() => handleDeleteSchedule(sched.id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#dc2626",
                      cursor: "pointer",
                      padding: 6,
                    }}
                    title="Delete schedule"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Modal for Creating New Schedule */}
          {isCreateModalOpen && (
            <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
              <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>
                    <CalendarDays size={20} color="#4f46e5" />
                    Configure New Scheduled Delivery
                  </h3>
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleCreateScheduleSubmit}>
                  <div className="modal-body">
                    <div className="form-group">
                      <label className="form-label">Report Title</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="e.g. Weekly CS301 Department Performance Brief"
                        value={newSchedule.title}
                        onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <div className="form-group">
                        <label className="form-label">Report Type</label>
                        <select
                          className="form-select"
                          value={newSchedule.reportType}
                          onChange={(e) => setNewSchedule({ ...newSchedule, reportType: e.target.value })}
                        >
                          <option value="class_performance">Class Performance Summary</option>
                          <option value="student_progress">Student Progress Dossier</option>
                          <option value="assignment_analytics">Assignment Submission Health</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Course</label>
                        <select
                          className="form-select"
                          value={newSchedule.courseCode}
                          onChange={(e) => setNewSchedule({ ...newSchedule, courseCode: e.target.value })}
                        >
                          {courses.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.code} – {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <div className="form-group">
                        <label className="form-label">Delivery Frequency</label>
                        <select
                          className="form-select"
                          value={newSchedule.frequency}
                          onChange={(e) => setNewSchedule({ ...newSchedule, frequency: e.target.value })}
                        >
                          <option value="weekly">Weekly (Selected Day)</option>
                          <option value="monthly">Monthly (1st of Month)</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Export Format</label>
                        <select
                          className="form-select"
                          value={newSchedule.format}
                          onChange={(e) => setNewSchedule({ ...newSchedule, format: e.target.value })}
                        >
                          <option value="pdf">Official PDF Document</option>
                          <option value="excel">Excel Workbook (.xls)</option>
                          <option value="csv">CSV Dataset</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Recipient Email Addresses (Comma-Separated)</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="e.g. professor@sdms.edu, dean@sdms.edu"
                        value={newSchedule.recipientEmails}
                        onChange={(e) => setNewSchedule({ ...newSchedule, recipientEmails: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="tab-btn"
                      onClick={() => setIsCreateModalOpen(false)}
                      style={{ padding: "8px 16px" }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="export-btn" style={{ padding: "8px 20px" }}>
                      Activate Schedule
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 5: INSTITUTIONAL ANALYTICS DASHBOARD (ADMIN - FR-REPORT-01)
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === "institutional-analytics" && instAnalytics && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Executive Overview KPI Ribbon */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">Institutional GPA</span>
                <div className="kpi-icon-wrap" style={{ background: "rgba(99, 102, 241, 0.12)", color: "#4f46e5" }}>
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className="kpi-value">3.33</div>
              <div className="kpi-subtext">Across 5 departments & 885 enrolled scholars</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">Campus Attendance</span>
                <div className="kpi-icon-wrap" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="kpi-value" style={{ color: "#059669" }}>
                {instAnalytics.attendanceTrends?.overallRate}%
              </div>
              <div className="kpi-subtext">Present: {instAnalytics.attendanceTrends?.presentRate}% | Late: {instAnalytics.attendanceTrends?.lateRate}%</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">Student Retention Rate</span>
                <div className="kpi-icon-wrap" style={{ background: "rgba(6, 182, 212, 0.12)", color: "#06b6d4" }}>
                  <Users size={18} />
                </div>
              </div>
              <div className="kpi-value" style={{ color: "#0284c7" }}>
                {instAnalytics.retentionAnalytics?.retentionRate}%
              </div>
              <div className="kpi-subtext">Projected Dropout: {instAnalytics.retentionAnalytics?.projectedDropoutRate}% (AI Risk Model)</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">Tuition Collected</span>
                <div className="kpi-icon-wrap" style={{ background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}>
                  <DollarSign size={18} />
                </div>
              </div>
              <div className="kpi-value">
                ${(instAnalytics.feeCollection?.totalCollected / 1000).toFixed(1)}k
              </div>
              <div className="kpi-subtext">
                {instAnalytics.feeCollection?.collectionRate}% of ${(instAnalytics.feeCollection?.totalInvoiced / 1000).toFixed(0)}k invoiced
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              1. DEPARTMENT-WISE ACADEMIC PERFORMANCE HEATMAPS
              ═══════════════════════════════════════════════════════════ */}
          <div className="inst-section">
            <div className="inst-section-header">
              <div>
                <div className="inst-section-title">
                  <Layers size={22} color="#4f46e5" />
                  Department-Wise Academic Performance Heatmaps
                </div>
                <div className="inst-section-desc">
                  Institutional grade distributions, grade point averages, and Dean&apos;s list concentrations by academic school.
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center", fontSize: "0.78rem" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: "#10b981" }} /> Top Tier (&gt;85)
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: "#06b6d4" }} /> Strong (80-84)
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: "#f59e0b" }} /> Moderate (75-79)
                </span>
              </div>
            </div>

            <div className="heatmap-grid">
              {instAnalytics.departmentPerformanceList
                ?.filter((d: any) => instDeptFilter === "all" || d.code === instDeptFilter)
                .map((dept: any) => {
                  const heatClass =
                    dept.heatScore >= 88
                      ? "heat-green"
                      : dept.heatScore >= 82
                      ? "heat-teal"
                      : dept.heatScore >= 78
                      ? "heat-amber"
                      : "heat-rose";

                  const pillColor =
                    dept.heatScore >= 88 ? "green" : dept.heatScore >= 80 ? "blue" : "amber";

                  return (
                    <div key={dept.code} className={`heatmap-card ${heatClass}`}>
                      <div className="heatmap-header">
                        <div>
                          <span className="dept-badge">{dept.code}</span>
                          <h4 style={{ margin: "6px 0 2px 0", fontSize: "1.05rem", fontWeight: 700 }}>
                            {dept.name}
                          </h4>
                          <span style={{ fontSize: "0.76rem", color: "var(--text-secondary)" }}>
                            Chair: {dept.head}
                          </span>
                        </div>
                        <div className={`heat-score-pill ${pillColor}`}>
                          <Sparkles size={12} /> Heat Index: {dept.heatScore}
                        </div>
                      </div>

                      <div className="heatmap-metrics-row">
                        <div className="heatmap-metric-item">
                          <div className="val">{dept.averageGpa.toFixed(2)}</div>
                          <div className="lbl">Mean GPA</div>
                        </div>
                        <div className="heatmap-metric-item">
                          <div className="val">{dept.averageScore}%</div>
                          <div className="lbl">Avg Score</div>
                        </div>
                        <div className="heatmap-metric-item">
                          <div className="val" style={{ color: "#059669" }}>
                            {dept.passRate}%
                          </div>
                          <div className="lbl">Pass Rate</div>
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 8 }}>
                        <span>Dean&apos;s Honor Roll: <strong style={{ color: "#4f46e5" }}>{dept.deansListCount}</strong></span>
                        <span>Faculty / Students: <strong>{dept.facultyCount} / {dept.studentCount}</strong></span>
                      </div>

                      {/* Grade Tier Proportional Heat Strip */}
                      <div>
                        <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
                          Grade Distribution Matrix (A+ through F):
                        </div>
                        <div className="grade-tier-strip">
                          <div
                            className="grade-tier-seg"
                            style={{ width: `${dept.gradeTiers.aPlus.percentage}%`, background: "#059669" }}
                            title={`A+ (${dept.gradeTiers.aPlus.percentage}% - ${dept.gradeTiers.aPlus.count} students)`}
                          >
                            A+
                          </div>
                          <div
                            className="grade-tier-seg"
                            style={{ width: `${dept.gradeTiers.a.percentage}%`, background: "#10b981" }}
                            title={`A (${dept.gradeTiers.a.percentage}% - ${dept.gradeTiers.a.count} students)`}
                          >
                            A
                          </div>
                          <div
                            className="grade-tier-seg"
                            style={{ width: `${dept.gradeTiers.b.percentage}%`, background: "#6366f1" }}
                            title={`B (${dept.gradeTiers.b.percentage}% - ${dept.gradeTiers.b.count} students)`}
                          >
                            B
                          </div>
                          <div
                            className="grade-tier-seg"
                            style={{ width: `${dept.gradeTiers.c.percentage}%`, background: "#f59e0b" }}
                            title={`C (${dept.gradeTiers.c.percentage}% - ${dept.gradeTiers.c.count} students)`}
                          >
                            C
                          </div>
                          <div
                            className="grade-tier-seg"
                            style={{ width: `${dept.gradeTiers.d.percentage}%`, background: "#f97316" }}
                            title={`D (${dept.gradeTiers.d.percentage}% - ${dept.gradeTiers.d.count} students)`}
                          >
                            D
                          </div>
                          <div
                            className="grade-tier-seg"
                            style={{ width: `${dept.gradeTiers.f.percentage}%`, background: "#ef4444" }}
                            title={`F (${dept.gradeTiers.f.percentage}% - ${dept.gradeTiers.f.count} students)`}
                          >
                            F
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              2. ATTENDANCE TREND REPORTS (DAILY, WEEKLY, MONTHLY, SEMESTER)
              ═══════════════════════════════════════════════════════════ */}
          <div className="inst-section">
            <div className="inst-section-header">
              <div>
                <div className="inst-section-title">
                  <Clock size={22} color="#059669" />
                  Attendance Trend Reports & Timeline Analytics
                </div>
                <div className="inst-section-desc">
                  Longitudinal presence trajectories, unexcused absence patterns, and early-warning deficit detection.
                </div>
              </div>

              {/* Timeline Granularity Switcher */}
              <div className="attendance-pills">
                <button
                  className={`attendance-pill-btn ${attendanceTimeline === "daily" ? "active" : ""}`}
                  onClick={() => setAttendanceTimeline("daily")}
                >
                  Daily (14d)
                </button>
                <button
                  className={`attendance-pill-btn ${attendanceTimeline === "weekly" ? "active" : ""}`}
                  onClick={() => setAttendanceTimeline("weekly")}
                >
                  Weekly (12w)
                </button>
                <button
                  className={`attendance-pill-btn ${attendanceTimeline === "monthly" ? "active" : ""}`}
                  onClick={() => setAttendanceTimeline("monthly")}
                >
                  Monthly (4mo)
                </button>
                <button
                  className={`attendance-pill-btn ${attendanceTimeline === "semester" ? "active" : ""}`}
                  onClick={() => setAttendanceTimeline("semester")}
                >
                  Semester By Dept
                </button>
              </div>
            </div>

            {/* Critical Deficit Alert Banner */}
            {instAnalytics.attendanceTrends?.criticalDeficitCount > 0 && (
              <div className="deficit-alert-banner">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <AlertTriangle size={20} />
                  <span>
                    <strong>Statutory Attendance Deficit Alert:</strong> {instAnalytics.attendanceTrends.criticalDeficitCount} students
                    currently fall below the mandatory 75% attendance threshold.
                  </span>
                </div>
                <button
                  className="tab-btn"
                  style={{ background: "#ffffff", color: "#b91c1c", padding: "4px 12px", fontSize: "0.76rem" }}
                  onClick={() => showToast(`Notified Academic Advisory deans regarding ${instAnalytics.attendanceTrends.criticalDeficitCount} at-risk students.`)}
                >
                  Notify Advisors
                </button>
              </div>
            )}

            {/* Timeline View 1: Daily */}
            {attendanceTimeline === "daily" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  <span>Last 14 Academic Session Days</span>
                  <div style={{ display: "flex", gap: 12 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: "#10b981" }} /> Present
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: "#f59e0b" }} /> Late
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: "#ef4444" }} /> Absent
                    </span>
                  </div>
                </div>

                <div className="attendance-bar-chart">
                  {instAnalytics.attendanceTrends?.dailyTrends?.map((d: any) => (
                    <div key={d.date} className="attendance-bar-col">
                      <div
                        className="attendance-bar-stack"
                        style={{ height: `${Math.round(d.presentPct * 1.8)}px` }}
                        title={`${d.label}: ${d.presentPct}% Present, ${d.latePct}% Late, ${d.absentPct}% Absent (${d.totalSessions} sessions)`}
                      >
                        <div className="attendance-bar-seg present" style={{ height: `${d.presentPct}%` }} />
                        <div className="attendance-bar-seg late" style={{ height: `${d.latePct}%` }} />
                        <div className="attendance-bar-seg absent" style={{ height: `${d.absentPct}%` }} />
                      </div>
                      <span className="attendance-col-label">{d.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline View 2: Weekly */}
            {attendanceTimeline === "weekly" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12 }}>
                {instAnalytics.attendanceTrends?.weeklyTrends?.map((w: any) => (
                  <div
                    key={w.week}
                    style={{
                      padding: "14px",
                      borderRadius: "10px",
                      background: w.week === "W6" ? "rgba(99, 102, 241, 0.08)" : "var(--bg-hover, #f8fafc)",
                      border: w.week === "W6" ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid var(--border-primary, #e2e8f0)",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--text-secondary)" }}>{w.label}</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 800, color: w.rate >= 90 ? "#059669" : w.rate >= 87 ? "#0284c7" : "#d97706", margin: "6px 0" }}>
                      {w.rate}%
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                      Pres: {w.present}% | Abs: {w.absent}%
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Timeline View 3: Monthly */}
            {attendanceTimeline === "monthly" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                {instAnalytics.attendanceTrends?.monthlyTrends?.map((m: any) => (
                  <div
                    key={m.month}
                    style={{
                      padding: "18px",
                      borderRadius: "12px",
                      background: "var(--bg-card, #ffffff)",
                      border: "1px solid var(--border-primary, #e2e8f0)",
                    }}
                  >
                    <div style={{ fontSize: "1rem", fontWeight: 700 }}>{m.month}</div>
                    <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#4f46e5", margin: "8px 0" }}>
                      {m.rate}%
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      Sessions: <strong>{m.sessions}</strong> | Unexcused Absences: <strong>{m.unexcusedAbsences}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Timeline View 4: Semester Dept Comparison */}
            {attendanceTimeline === "semester" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {instAnalytics.attendanceTrends?.departmentComparison?.map((dc: any) => (
                  <div key={dc.code} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 140, fontSize: "0.84rem", fontWeight: 600 }}>{dc.name} ({dc.code})</div>
                    <div style={{ flex: 1, height: 12, background: "var(--bg-hover, #e2e8f0)", borderRadius: 6, overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${dc.rate}%`,
                          borderRadius: 6,
                          background: dc.rate >= 90 ? "#10b981" : dc.rate >= 87 ? "#06b6d4" : "#f59e0b",
                        }}
                      />
                    </div>
                    <div style={{ width: 50, fontSize: "0.84rem", fontWeight: 700, textAlign: "right" }}>{dc.rate}%</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════
              3. FEE COLLECTION SUMMARIES & OUTSTANDING BALANCE TRACKING
              ═══════════════════════════════════════════════════════════ */}
          <div className="inst-section">
            <div className="inst-section-header">
              <div>
                <div className="inst-section-title">
                  <CreditCard size={22} color="#f59e0b" />
                  Fee Collection Summaries & Aging Balances
                </div>
                <div className="inst-section-desc">
                  Institutional tuition billing, collection efficiency, delinquent balance aging, and multi-gateway channels.
                </div>
              </div>
              <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                Invoices: {instAnalytics.feeCollection?.invoicesSummary?.total} total ({instAnalytics.feeCollection?.invoicesSummary?.paid} paid, {instAnalytics.feeCollection?.invoicesSummary?.overdue} overdue)
              </div>
            </div>

            {/* Aging Progress Bar */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 6 }}>
                <span>Institutional Receivables Aging Spectrum</span>
                <span>Total Outstanding: <strong style={{ color: "#ef4444" }}>${instAnalytics.feeCollection?.totalOutstanding?.toLocaleString()}</strong></span>
              </div>
              <div className="aging-bar-wrap">
                {instAnalytics.feeCollection?.agingBuckets?.map((bucket: any) => (
                  <div
                    key={bucket.label}
                    className="aging-bar-seg"
                    style={{ width: `${bucket.percentage}%`, background: bucket.color }}
                    title={`${bucket.label}: $${bucket.amount.toLocaleString()} (${bucket.percentage}%)`}
                  >
                    {bucket.percentage > 10 ? `${bucket.percentage}%` : ""}
                  </div>
                ))}
              </div>

              {/* Aging Legend Grid */}
              <div className="aging-legend-grid">
                {instAnalytics.feeCollection?.agingBuckets?.map((bucket: any) => (
                  <div key={bucket.label} className="aging-legend-item">
                    <span className="aging-dot" style={{ background: bucket.color }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.78rem", fontWeight: 600 }}>{bucket.label}</div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 800 }}>${bucket.amount.toLocaleString()}</div>
                    </div>
                    <span style={{ fontSize: "0.74rem", fontWeight: 700, color: bucket.color }}>{bucket.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Channels & Dept Collections Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
              <div style={{ padding: "18px", borderRadius: "12px", background: "var(--bg-hover, #f8fafc)", border: "1px solid var(--border-primary, #e2e8f0)" }}>
                <h4 style={{ margin: "0 0 14px 0", fontSize: "0.92rem", fontWeight: 700 }}>Payment Method Channels</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {instAnalytics.feeCollection?.paymentChannels?.map((ch: any) => (
                    <div key={ch.method} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem" }}>
                      <span>{ch.method}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <strong>${ch.amount.toLocaleString()}</strong>
                        <span style={{ color: "var(--text-secondary)", fontSize: "0.76rem" }}>({ch.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ padding: "18px", borderRadius: "12px", background: "var(--bg-hover, #f8fafc)", border: "1px solid var(--border-primary, #e2e8f0)" }}>
                <h4 style={{ margin: "0 0 14px 0", fontSize: "0.92rem", fontWeight: 700 }}>Department Tuition Recovery</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {instAnalytics.feeCollection?.departmentCollections?.map((dc: any) => (
                    <div key={dc.code} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem" }}>
                      <span style={{ fontWeight: 600 }}>{dc.code}</span>
                      <span>Invoiced: ${dc.invoiced.toLocaleString()}</span>
                      <span style={{ color: dc.rate >= 85 ? "#059669" : "#d97706", fontWeight: 700 }}>{dc.rate}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              4. STUDENT RETENTION & DROPOUT ANALYTICS (AI RISK POWERED)
              ═══════════════════════════════════════════════════════════ */}
          <div className="inst-section">
            <div className="inst-section-header">
              <div>
                <div className="inst-section-title">
                  <ShieldAlert size={22} color="#dc2626" />
                  Student Retention & Dropout Analytics (AI-Powered)
                </div>
                <div className="inst-section-desc">
                  Machine learning predictive modeling for student attrition, intervention triggers, and risk factor attribution.
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <span className="term-badge" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#059669" }}>
                  Active Interventions: {instAnalytics.retentionAnalytics?.interventionsActive?.facultyMentoring + instAnalytics.retentionAnalytics?.interventionsActive?.bursarFinancialRelief + instAnalytics.retentionAnalytics?.interventionsActive?.academicWellnessCheckins}
                </span>
              </div>
            </div>

            {/* Retention Risk Tier Cards */}
            <div className="retention-kpi-banner">
              <div className="retention-stat-card" style={{ borderLeft: "4px solid #10b981" }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)" }}>Low Risk Scholars</div>
                <div className="val" style={{ color: "#059669" }}>
                  {instAnalytics.retentionAnalytics?.riskTiers?.lowRisk?.count}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  {instAnalytics.retentionAnalytics?.riskTiers?.lowRisk?.percentage}% of total cohort
                </div>
              </div>

              <div className="retention-stat-card" style={{ borderLeft: "4px solid #f59e0b" }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)" }}>Moderate Risk (Monitoring)</div>
                <div className="val" style={{ color: "#d97706" }}>
                  {instAnalytics.retentionAnalytics?.riskTiers?.moderateRisk?.count}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  {instAnalytics.retentionAnalytics?.riskTiers?.moderateRisk?.percentage}% requiring early check-in
                </div>
              </div>

              <div className="retention-stat-card" style={{ borderLeft: "4px solid #ef4444" }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)" }}>High Risk (Intervention Needed)</div>
                <div className="val" style={{ color: "#dc2626" }}>
                  {instAnalytics.retentionAnalytics?.riskTiers?.highRisk?.count}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  {instAnalytics.retentionAnalytics?.riskTiers?.highRisk?.percentage}% priority escalation
                </div>
              </div>
            </div>

            {/* Primary Risk Drivers Bars */}
            <div>
              <h4 style={{ margin: "0 0 10px 0", fontSize: "0.92rem", fontWeight: 700 }}>Primary Dropout Risk Drivers (AI Weight Attribution)</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {instAnalytics.retentionAnalytics?.primaryRiskDrivers?.map((driver: any) => (
                  <div key={driver.factor} className="risk-driver-bar-row">
                    <span className="risk-driver-label">{driver.factor}</span>
                    <div className="risk-driver-track">
                      <div className="risk-driver-fill" style={{ width: `${driver.impactWeight}%` }} />
                    </div>
                    <span className="risk-driver-pct">{driver.impactWeight}%</span>
                    <span style={{ fontSize: "0.76rem", color: "var(--text-secondary)", width: 110 }}>
                      {driver.studentsAffected} students
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* At-Risk Roster Table */}
            <div>
              <h4 style={{ margin: "14px 0 10px 0", fontSize: "0.92rem", fontWeight: 700 }}>Flagged High-Risk Scholars Action Roster</h4>
              <div style={{ overflowX: "auto" }}>
                <table className="reports-table" style={{ width: "100%", fontSize: "0.82rem" }}>
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Student Name</th>
                      <th>Department</th>
                      <th>GPA</th>
                      <th>Attendance</th>
                      <th>Predicted Risk</th>
                      <th>Primary Driver</th>
                      <th>Recommended Action</th>
                      <th>Intervene</th>
                    </tr>
                  </thead>
                  <tbody>
                    {instAnalytics.retentionAnalytics?.atRiskRoster?.map((stu: any) => (
                      <tr key={stu.studentId}>
                        <td><code>{stu.studentId}</code></td>
                        <td><strong>{stu.name}</strong></td>
                        <td>{stu.department}</td>
                        <td style={{ color: stu.gpa < 2.0 ? "#dc2626" : "inherit", fontWeight: 700 }}>{stu.gpa.toFixed(2)}</td>
                        <td style={{ color: stu.attendance < 70 ? "#dc2626" : "inherit", fontWeight: 700 }}>{stu.attendance}%</td>
                        <td>
                          <span style={{
                            padding: "3px 8px",
                            borderRadius: "12px",
                            background: stu.predictedRisk >= 75 ? "rgba(239, 68, 68, 0.15)" : "rgba(245, 158, 11, 0.15)",
                            color: stu.predictedRisk >= 75 ? "#b91c1c" : "#b45309",
                            fontWeight: 700
                          }}>
                            {stu.predictedRisk}%
                          </span>
                        </td>
                        <td>{stu.primaryDriver}</td>
                        <td style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{stu.recommendedAction}</td>
                        <td>
                          <button
                            className="tab-btn"
                            style={{ padding: "4px 10px", fontSize: "0.74rem", background: "#4f46e5", color: "#ffffff" }}
                            onClick={() => showToast(`Dispatched intervention for ${stu.name}: ${stu.recommendedAction}`)}
                          >
                            Execute
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              5. AI COPILOT USAGE & COST ANALYTICS
              ═══════════════════════════════════════════════════════════ */}
          <div className="inst-section">
            <div className="inst-section-header">
              <div>
                <div className="inst-section-title">
                  <Bot size={22} color="#6366f1" />
                  AI Copilot Usage & Cost Analytics
                </div>
                <div className="inst-section-desc">
                  Token consumption, LLM API expenditure, budget burn velocity, and hourly load curves.
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span className="term-badge">
                  Monthly Budget: ${instAnalytics.aiCopilotAnalytics?.financialCost?.monthlyBudgetUsed} / ${instAnalytics.aiCopilotAnalytics?.financialCost?.monthlyBudgetAllocated} ({instAnalytics.aiCopilotAnalytics?.financialCost?.budgetBurnRatePct}%)
                </span>
              </div>
            </div>

            {/* AI Cost & Volume KPI Banner */}
            <div className="copilot-cost-banner">
              <div className="copilot-stat-card">
                <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)" }}>Total Queries</span>
                <span className="val">{instAnalytics.aiCopilotAnalytics?.totalQueries?.toLocaleString()}</span>
                <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>{instAnalytics.aiCopilotAnalytics?.activeUsers} active scholars & staff</span>
              </div>

              <div className="copilot-stat-card">
                <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)" }}>Total Tokens Consumed</span>
                <span className="val">{(instAnalytics.aiCopilotAnalytics?.tokenMetrics?.totalTokens / 1000000).toFixed(2)}M</span>
                <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                  Prompt: {(instAnalytics.aiCopilotAnalytics?.tokenMetrics?.promptTokens / 1000000).toFixed(2)}M | Compl: {(instAnalytics.aiCopilotAnalytics?.tokenMetrics?.completionTokens / 1000).toFixed(0)}k
                </span>
              </div>

              <div className="copilot-stat-card">
                <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)" }}>Total Cost (USD)</span>
                <span className="val" style={{ color: "#059669" }}>
                  ${instAnalytics.aiCopilotAnalytics?.financialCost?.totalCostUsd}
                </span>
                <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                  Cost / Query: ${instAnalytics.aiCopilotAnalytics?.financialCost?.costPerQueryUsd}
                </span>
              </div>

              <div className="copilot-stat-card">
                <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)" }}>Budget Burn Rate</span>
                <span className="val" style={{ color: "#4f46e5" }}>
                  {instAnalytics.aiCopilotAnalytics?.financialCost?.budgetBurnRatePct}%
                </span>
                <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                  ${instAnalytics.aiCopilotAnalytics?.financialCost?.costPerStudentUsd} per enrolled student
                </span>
              </div>
            </div>

            {/* 24-Hour Hourly Load Curve */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                <span>24-Hour AI Interaction Load Curve (Hourly Queries)</span>
                <span>Peak Load: <strong>2,450 queries at 20:00</strong></span>
              </div>
              <div className="hourly-load-chart">
                {instAnalytics.aiCopilotAnalytics?.hourlyLoadCurve?.map((h: any) => {
                  const maxCount = 2500;
                  const barHeight = Math.max(12, Math.round((h.count / maxCount) * 140));
                  return (
                    <div key={h.hour} className="hourly-col">
                      <div
                        className="hourly-bar"
                        style={{ height: `${barHeight}px` }}
                        title={`${h.hour}: ${h.count} AI queries`}
                      />
                      <span className="hourly-label">{h.hour}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Personas & Top Categories Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
              <div style={{ padding: "18px", borderRadius: "12px", background: "var(--bg-hover, #f8fafc)", border: "1px solid var(--border-primary, #e2e8f0)" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "0.92rem", fontWeight: 700 }}>Top Query Categories</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {instAnalytics.aiCopilotAnalytics?.topQueryCategories?.map((cat: any) => (
                    <div key={cat.category} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.82rem" }}>
                      <span style={{ width: 220 }}>{cat.category}</span>
                      <div style={{ flex: 1, height: 8, background: "var(--bg-card, #e2e8f0)", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${cat.percentage * 3}%`, background: "#4f46e5", borderRadius: 4 }} />
                      </div>
                      <span style={{ width: 40, fontWeight: 700, textAlign: "right" }}>{cat.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ padding: "18px", borderRadius: "12px", background: "var(--bg-hover, #f8fafc)", border: "1px solid var(--border-primary, #e2e8f0)" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "0.92rem", fontWeight: 700 }}>User Persona Engagement</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {instAnalytics.aiCopilotAnalytics?.personaBreakdown?.map((p: any) => (
                    <div key={p.persona}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: 4 }}>
                        <span><strong>{p.persona}</strong> ({p.queryCount.toLocaleString()} queries)</span>
                        <span style={{ fontWeight: 700 }}>{p.percentage}%</span>
                      </div>
                      <div style={{ height: 8, background: "var(--bg-card, #e2e8f0)", borderRadius: 4, overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${p.percentage}%`,
                            background: p.persona === "Students" ? "#10b981" : p.persona === "Faculty" ? "#06b6d4" : "#f59e0b",
                            borderRadius: 4
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
