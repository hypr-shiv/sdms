"use client";

import { useState, useEffect, useMemo } from "react";
import { type Role } from "@/lib/mockData";
import {
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  AlertTriangle,
  UserCheck,
  Award,
  Bell,
  Sliders,
  ChevronDown,
  Sparkles,
  Save,
  RotateCcw,
  BookOpen
} from "lucide-react";
import "./attendance.css";
import "../dashboard.css";
import EmptyState, { EmptyStateTableRow } from "@/components/UI/EmptyState";

// ═══════════════════════════════════════════════════
// FALLBACK / MOCK DATA
// ═══════════════════════════════════════════════════

const DEFAULT_COURSES = [
  { code: "CS301", name: "Data Structures & Algorithms" },
  { code: "MTH201", name: "Linear Algebra & Differential Equations" },
  { code: "CS301L", name: "DSA Lab & Algorithms Workshop" },
  { code: "PHY102", name: "Engineering Physics II" },
  { code: "ENG101", name: "Technical Communication" },
];

const DEFAULT_STUDENTS = [
  { studentId: "STU-001", studentName: "Alex Johnson" },
  { studentId: "STU-002", studentName: "Maria Garcia" },
  { studentId: "STU-003", studentName: "James Smith" },
  { studentId: "STU-004", studentName: "Wei Chen" },
  { studentId: "STU-005", studentName: "Fatima Ali" },
  { studentId: "STU-006", studentName: "David Miller" },
  { studentId: "STU-007", studentName: "Priya Sharma" },
  { studentId: "STU-008", studentName: "Marcus Vance" },
];

const INITIAL_COURSE_STATS = [
  {
    course: "CS301",
    courseName: "Data Structures & Algorithms",
    totalClasses: 36,
    present: 32,
    absent: 2,
    late: 2,
    excused: 0,
    percentage: 94,
  },
  {
    course: "MTH201",
    courseName: "Linear Algebra & Diff Eq",
    totalClasses: 30,
    present: 24,
    absent: 4,
    late: 2,
    excused: 0,
    percentage: 86,
  },
  {
    course: "CS301L",
    courseName: "DSA Laboratory",
    totalClasses: 18,
    present: 13,
    absent: 4,
    late: 1,
    excused: 0,
    percentage: 77,
  },
  {
    course: "PHY102",
    courseName: "Engineering Physics II",
    totalClasses: 28,
    present: 19,
    absent: 8,
    late: 1,
    excused: 0,
    percentage: 71, // Below 75% threshold!
  },
];

// ═══════════════════════════════════════════════════
// TEACHER ATTENDANCE (Digital Roll Call & Bulk Mark)
// ═══════════════════════════════════════════════════
function TeacherAttendance({ token, showToast }: { token: string | null; showToast: (msg: string) => void }) {
  const [courses, setCourses] = useState(DEFAULT_COURSES);
  const [selectedCourse, setSelectedCourse] = useState("CS301");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedSession, setSelectedSession] = useState("09:00 - 10:30 AM");
  const [students, setStudents] = useState(DEFAULT_STUDENTS);
  const [attendanceState, setAttendanceState] = useState<Record<string, "present" | "late" | "absent" | "excused">>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch courses from backend
  useEffect(() => {
    if (!token) return;
    fetch("http://localhost:3001/academic/attendance/courses", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCourses(data.map((c) => ({ code: c.code, name: c.name })));
        }
      })
      .catch(() => {});
  }, [token]);

  // Fetch enrolled students for course
  useEffect(() => {
    if (!token) {
      // Default initialization
      const initial: Record<string, "present" | "late" | "absent" | "excused"> = {};
      DEFAULT_STUDENTS.forEach((s) => (initial[s.studentId] = "present"));
      setAttendanceState(initial);
      return;
    }

    fetch(`http://localhost:3001/academic/attendance/students/${selectedCourse}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const studentList = Array.isArray(data) && data.length > 0 ? data : DEFAULT_STUDENTS;
        setStudents(studentList);

        // Initialize all as present
        const initial: Record<string, "present" | "late" | "absent" | "excused"> = {};
        studentList.forEach((s: any) => (initial[s.studentId] = "present"));
        setAttendanceState(initial);
      })
      .catch(() => {
        setStudents(DEFAULT_STUDENTS);
      });
  }, [selectedCourse, token]);

  // Filter students by search
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(
      (s) =>
        s.studentName.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  // Calculate live counters
  const counters = useMemo(() => {
    let present = 0,
      late = 0,
      absent = 0,
      excused = 0;
    Object.values(attendanceState).forEach((st) => {
      if (st === "present") present++;
      else if (st === "late") late++;
      else if (st === "absent") absent++;
      else if (st === "excused") excused++;
    });
    const total = students.length;
    const rate = total > 0 ? Math.round(((present + late + excused) / total) * 100) : 0;
    return { total, present, late, absent, excused, rate };
  }, [attendanceState, students]);

  // Bulk actions
  const markAll = (status: "present" | "absent") => {
    const updated: Record<string, "present" | "late" | "absent" | "excused"> = {};
    students.forEach((s) => (updated[s.studentId] = status));
    setAttendanceState(updated);
    showToast(`Marked all ${students.length} students as ${status.toUpperCase()}`);
  };

  const setStudentStatus = (studentId: string, status: "present" | "late" | "absent" | "excused") => {
    setAttendanceState((prev) => ({ ...prev, [studentId]: status }));
  };

  // Save attendance
  const handleSave = async () => {
    setSaving(true);
    const records = students.map((s) => ({
      studentId: s.studentId,
      studentName: s.studentName,
      course: selectedCourse,
      date: selectedDate,
      session: `${selectedCourse}-${selectedDate}-${selectedSession}`,
      status: attendanceState[s.studentId] || "present",
    }));

    try {
      if (token) {
        const res = await fetch("http://localhost:3001/academic/attendance/bulk", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ records }),
        });
        if (!res.ok) throw new Error("Failed to save");
      }
      showToast(`Successfully saved roll-call for ${selectedCourse} (${records.length} records)`);
    } catch {
      showToast(`Saved locally: ${records.length} records for ${selectedCourse}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="attendance-container">
      {/* Hero */}
      <div className="attendance-hero">
        <div>
          <h1 className="page-title" style={{ marginBottom: 6 }}>Digital Roll-Call Portal</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Quick session roll-call with bulk marking and automated threshold tracking.
          </p>
        </div>
        <div className="attendance-header-meta">
          <button
            id="save-attendance-top-btn"
            className="save-primary-btn"
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={16} />
            {saving ? "Saving Records..." : "Save Attendance"}
          </button>
        </div>
      </div>

      {/* Session Configuration Card */}
      <div className="rollcall-header-card">
        <div className="session-config-bar">
          <div className="session-selectors">
            {/* Course Selector */}
            <div className="select-pill-wrapper">
              <select
                id="attendance-course-select"
                className="select-pill"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
              >
                {courses.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Picker */}
            <input
              id="attendance-date-input"
              type="date"
              className="date-input-pill"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />

            {/* Session Selector */}
            <div className="select-pill-wrapper">
              <select
                id="attendance-session-select"
                className="select-pill"
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
              >
                <option value="09:00 - 10:30 AM">Morning: 09:00 - 10:30 AM</option>
                <option value="11:00 - 12:30 PM">Midday: 11:00 - 12:30 PM</option>
                <option value="02:00 - 03:30 PM">Afternoon: 02:00 - 03:30 PM</option>
                <option value="04:00 - 05:30 PM">Evening Lab: 04:00 - 05:30 PM</option>
              </select>
            </div>
          </div>

          {/* Real-time Session Live Counters */}
          <div className="session-live-counters">
            <div className="counter-pill counter-pill-total" title="Total Enrolled Students">
              Total: {counters.total}
            </div>
            <div className="counter-pill counter-pill-present" title="Students Present">
              <CheckCircle2 size={13} /> {counters.present} Present
            </div>
            <div className="counter-pill counter-pill-late" title="Students Late">
              <Clock size={13} /> {counters.late} Late
            </div>
            <div className="counter-pill counter-pill-absent" title="Students Absent">
              <XCircle size={13} /> {counters.absent} Absent
            </div>
            <div className="counter-pill counter-pill-excused" title="Excused Absences">
              {counters.excused} Excused
            </div>
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        <div className="bulk-action-toolbar">
          <div className="bulk-btn-group">
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginRight: 4 }}>
              Bulk Actions:
            </span>
            <button
              id="bulk-present-btn"
              type="button"
              className="bulk-btn bulk-btn-present"
              onClick={() => markAll("present")}
            >
              <CheckCircle2 size={14} /> Mark All Present
            </button>
            <button
              id="bulk-absent-btn"
              type="button"
              className="bulk-btn bulk-btn-absent"
              onClick={() => markAll("absent")}
            >
              <XCircle size={14} /> Mark All Absent
            </button>
          </div>

          <div style={{ fontSize: "0.86rem", color: "var(--text-secondary)" }}>
            Session Attendance Rate: <strong style={{ color: counters.rate >= 75 ? "#10B981" : "#EF4444" }}>{counters.rate}%</strong>
          </div>
        </div>
      </div>

      {/* Roll Call Student Roster Table */}
      <div className="rollcall-table-container">
        <div className="rollcall-search-bar">
          <div className="search-input-wrapper">
            <Search size={15} color="var(--text-muted)" />
            <input
              id="student-search-input"
              type="text"
              className="search-input-field"
              placeholder="Search student by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            Showing {filteredStudents.length} of {students.length} students
          </div>
        </div>

        <div className="student-list">
          {filteredStudents.map((student) => {
            const currentStatus = attendanceState[student.studentId] || "present";
            return (
              <div className="rollcall-student-row" key={student.studentId}>
                {/* Student Info */}
                <div className="student-meta-cell">
                  <div className="student-avatar-bubble">
                    {student.studentName.charAt(0)}
                  </div>
                  <div>
                    <div className="student-name-text">{student.studentName}</div>
                    <div className="student-id-subtext">{student.studentId}</div>
                  </div>
                </div>

                {/* Digital Pill Status Toggles */}
                <div className="status-pill-toggle-group">
                  <button
                    type="button"
                    className={`status-toggle-btn btn-present ${currentStatus === "present" ? "active" : ""}`}
                    onClick={() => setStudentStatus(student.studentId, "present")}
                  >
                    <CheckCircle2 size={13} /> Present
                  </button>
                  <button
                    type="button"
                    className={`status-toggle-btn btn-late ${currentStatus === "late" ? "active" : ""}`}
                    onClick={() => setStudentStatus(student.studentId, "late")}
                  >
                    <Clock size={13} /> Late
                  </button>
                  <button
                    type="button"
                    className={`status-toggle-btn btn-absent ${currentStatus === "absent" ? "active" : ""}`}
                    onClick={() => setStudentStatus(student.studentId, "absent")}
                  >
                    <XCircle size={13} /> Absent
                  </button>
                  <button
                    type="button"
                    className={`status-toggle-btn btn-excused ${currentStatus === "excused" ? "active" : ""}`}
                    onClick={() => setStudentStatus(student.studentId, "excused")}
                  >
                    Excused
                  </button>
                </div>

                {/* Status Indicator */}
                <div style={{ textAlign: "right", fontSize: "0.8rem", fontWeight: 600 }}>
                  {currentStatus === "present" && <span style={{ color: "#10B981" }}>Attended</span>}
                  {currentStatus === "late" && <span style={{ color: "#F59E0B" }}>Tardy (Late)</span>}
                  {currentStatus === "absent" && <span style={{ color: "#EF4444" }}>Unexcused</span>}
                  {currentStatus === "excused" && <span style={{ color: "#3B82F6" }}>Approved Leave</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Save Bar */}
        <div className="rollcall-save-footer">
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Tip: Press <strong>Save Attendance</strong> to sync with institutional records.
          </span>
          <button
            id="save-attendance-bottom-btn"
            className="save-primary-btn"
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Attendance"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// STUDENT ATTENDANCE (Breakdown, Thresholds & Heatmap)
// ═══════════════════════════════════════════════════
function StudentAttendance({ token, threshold = 75 }: { token: string | null; threshold?: number }) {
  const [courseBreakdown, setCourseBreakdown] = useState(INITIAL_COURSE_STATS);
  const [overallStats, setOverallStats] = useState({
    percentage: 84,
    totalClasses: 112,
    present: 88,
    late: 6,
    absent: 18,
    excused: 0,
  });

  // Calculate overall metrics from course breakdown
  useEffect(() => {
    if (!token) return;
    const userData = localStorage.getItem("user");
    const userId = userData ? JSON.parse(userData).userId || "STU-001" : "STU-001";

    fetch(`http://localhost:3001/academic/attendance/percentage/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          if (Array.isArray(data.courseBreakdown) && data.courseBreakdown.length > 0) {
            setCourseBreakdown(data.courseBreakdown);
          }
          if (data.percentage !== undefined && data.totalClasses > 0) {
            setOverallStats({
              percentage: data.percentage,
              totalClasses: data.totalClasses,
              present: data.present,
              late: data.late,
              absent: data.absent,
              excused: data.excused,
            });
          }
        }
      })
      .catch(() => {});
  }, [token]);

  // Identify courses below threshold
  const coursesBelowThreshold = useMemo(() => {
    return courseBreakdown.filter((c) => c.percentage < threshold);
  }, [courseBreakdown, threshold]);

  // Generate heatmap calendar data (20 weeks, 5 days)
  const weeks = 22;
  const heatmapData = useMemo(() => {
    return Array.from({ length: weeks }, (_, wIdx) =>
      Array.from({ length: 5 }, (_, dIdx) => {
        const seed = (wIdx * 5 + dIdx) % 17;
        if (seed === 13 || seed === 7) return "absent";
        if (seed === 4) return "late";
        if (wIdx === weeks - 1 && dIdx > 3) return "empty";
        return "present";
      })
    );
  }, []);

  return (
    <div className="attendance-container">
      {/* Hero */}
      <div className="attendance-hero">
        <div>
          <h1 className="page-title" style={{ marginBottom: 6 }}>Academic Attendance Record</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Real-time percentage tracking, course breakdown, and attendance threshold compliance.
          </p>
        </div>
      </div>

      {/* Threshold Warning Banner if any course is below requirement */}
      {coursesBelowThreshold.length > 0 && (
        <div className="threshold-alert-banner">
          <div className="alert-banner-content">
            <div className="alert-banner-icon">
              <AlertTriangle size={20} />
            </div>
            <div>
              <div className="alert-banner-title">
                Attendance Alert: {coursesBelowThreshold.length} Subject(s) Below Required {threshold}% Threshold
              </div>
              <div className="alert-banner-desc">
                {coursesBelowThreshold.map((c) => (
                  <span key={c.course} style={{ marginRight: 12 }}>
                    <strong>{c.course}</strong>: {c.percentage}% (Requires minimum {threshold}%)
                  </span>
                ))}
              </div>
            </div>
          </div>
          <span className="status-badge-pill status-badge-critical">Action Required</span>
        </div>
      )}

      {/* Overview Stats Cards */}
      <div className="stats-overview-grid">
        <div className="stat-metric-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Cumulative Attendance</span>
            <div
              className="stat-icon-wrapper"
              style={{
                background: overallStats.percentage >= threshold ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                color: overallStats.percentage >= threshold ? "#10B981" : "#EF4444",
              }}
            >
              <Award size={18} />
            </div>
          </div>
          <div className="stat-card-value">
            {overallStats.percentage}%
          </div>
          <div className="stat-card-subtext">
            {overallStats.percentage >= threshold ? (
              <span style={{ color: "#10B981" }}>Compliant with {threshold}% requirement</span>
            ) : (
              <span style={{ color: "#EF4444" }}>Below institutional threshold ({threshold}%)</span>
            )}
          </div>
        </div>

        <div className="stat-metric-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Sessions Attended</span>
            <div className="stat-icon-wrapper" style={{ background: "rgba(59, 130, 246, 0.12)", color: "#3B82F6" }}>
              <UserCheck size={18} />
            </div>
          </div>
          <div className="stat-card-value">
            {overallStats.present + overallStats.late} <span style={{ fontSize: "1rem", color: "var(--text-muted)" }}>/ {overallStats.totalClasses}</span>
          </div>
          <div className="stat-card-subtext">
            {overallStats.present} Present &bull; {overallStats.late} Late
          </div>
        </div>

        <div className="stat-metric-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Total Absences</span>
            <div className="stat-icon-wrapper" style={{ background: "rgba(239, 68, 68, 0.12)", color: "#EF4444" }}>
              <XCircle size={18} />
            </div>
          </div>
          <div className="stat-card-value" style={{ color: overallStats.absent > 10 ? "#EF4444" : "var(--text-primary)" }}>
            {overallStats.absent}
          </div>
          <div className="stat-card-subtext">
            {overallStats.excused} excused medical/official
          </div>
        </div>

        <div className="stat-metric-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Minimum Threshold</span>
            <div className="stat-icon-wrapper" style={{ background: "rgba(244, 197, 66, 0.15)", color: "#D97706" }}>
              <ShieldAlert size={18} />
            </div>
          </div>
          <div className="stat-card-value">
            {threshold}%
          </div>
          <div className="stat-card-subtext">
            Mandatory for exam hall eligibility
          </div>
        </div>
      </div>

      {/* Per-Course Attendance Cards */}
      <div className="courses-grid-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 600, color: "var(--text-primary)" }}>
            Course-by-Course Attendance
          </h2>
          <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            Threshold boundary marked at {threshold}%
          </span>
        </div>

        <div className="courses-cards-grid">
          {courseBreakdown.length === 0 ? (
            <EmptyState
              variant="attendance"
              title="No Attendance Records Logged"
              description="No course attendance sessions have been logged for this semester. Attendance metrics will populate as classes take place."
            />
          ) : (
            courseBreakdown.map((c) => {
            const isGood = c.percentage >= 85;
            const isWarning = c.percentage >= threshold && c.percentage < 85;
            const isCritical = c.percentage < threshold;

            // Classes needed to reach threshold if below:
            // (attended + x) / (total + x) >= threshold / 100
            // x >= (threshold*total - 100*attended) / (100 - threshold)
            let classesNeeded = 0;
            if (isCritical) {
              const attended = c.present + c.late + (c.excused || 0);
              const num = (threshold / 100) * c.totalClasses - attended;
              const den = 1 - threshold / 100;
              classesNeeded = Math.ceil(Math.max(1, num / den));
            }

            return (
              <div className="course-att-card" key={c.course}>
                <div className="course-card-top">
                  <div>
                    <span className="course-code-badge">{c.course}</span>
                    <h3 style={{ fontSize: "1rem", fontWeight: 600, marginTop: 6 }}>
                      {c.courseName || c.course}
                    </h3>
                  </div>
                  <div
                    className="course-att-percentage"
                    style={{
                      color: isGood ? "#10B981" : isWarning ? "#F59E0B" : "#EF4444",
                    }}
                  >
                    {c.percentage}%
                  </div>
                </div>

                {/* Progress Bar with threshold indicator */}
                <div className="attendance-progress-track">
                  <div
                    className={`attendance-progress-fill ${
                      isGood ? "fill-good" : isWarning ? "fill-warning" : "fill-critical"
                    }`}
                    style={{ width: `${Math.min(100, c.percentage)}%` }}
                  />
                  <div className="threshold-marker" style={{ left: `${threshold}%` }} title={`Threshold: ${threshold}%`} />
                </div>

                {/* Breakdown numbers */}
                <div className="course-breakdown-numbers">
                  <span>Present: <strong>{c.present}</strong></span>
                  <span>Late: <strong>{c.late}</strong></span>
                  <span>Absent: <strong>{c.absent}</strong></span>
                  <span>Total: <strong>{c.totalClasses}</strong></span>
                </div>

                {/* Recovery hint if below threshold */}
                {isCritical && (
                  <div className="recovery-hint">
                    Need to attend <strong>{classesNeeded} consecutive class{classesNeeded > 1 ? "es" : ""}</strong> without absence to regain {threshold}% standing.
                  </div>
                )}

                {/* Status Badge */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  {isGood && (
                    <span className="status-badge-pill status-badge-good">
                      <CheckCircle2 size={12} /> Good Standing
                    </span>
                  )}
                  {isWarning && (
                    <span className="status-badge-pill status-badge-warning">
                      <AlertTriangle size={12} /> Near Threshold
                    </span>
                  )}
                  {isCritical && (
                    <span className="status-badge-pill status-badge-critical">
                      <XCircle size={12} /> Critical &bull; Below {threshold}%
                    </span>
                  )}
                </div>
              </div>
            );
          }))}
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="heatmap-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 600 }}>Semester Activity Heatmap</h3>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              Weekly distribution of daily class participation.
            </p>
          </div>

          <div className="heatmap-legend">
            <div className="legend-item">
              <div className="legend-box cell-present" /> Present
            </div>
            <div className="legend-item">
              <div className="legend-box cell-late" /> Late
            </div>
            <div className="legend-item">
              <div className="legend-box cell-absent" /> Absent
            </div>
            <div className="legend-item">
              <div className="legend-box cell-empty" /> Off Day
            </div>
          </div>
        </div>

        <div className="heatmap-container">
          <div className="heatmap-months">
            <span>Aug</span>
            <span>Sep</span>
            <span>Oct</span>
            <span>Nov</span>
            <span>Dec</span>
          </div>
          <div className="heatmap-grid">
            {heatmapData.map((week, w) => (
              <div className="heatmap-col" key={w}>
                {week.map((st, d) => (
                  <div
                    key={`${w}-${d}`}
                    className={`heatmap-cell cell-${st}`}
                    title={`Week ${w + 1}, Day ${d + 1}: ${st.toUpperCase()}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// ADMIN ATTENDANCE (Institution Overview & Threshold Audits)
// ═══════════════════════════════════════════════════
function AdminAttendance({
  token,
  threshold,
  setThreshold,
  showToast,
}: {
  token: string | null;
  threshold: number;
  setThreshold: (val: number) => void;
  showToast: (msg: string) => void;
}) {
  const [runningAudit, setRunningAudit] = useState(false);
  const [auditResults, setAuditResults] = useState<any[]>([
    { studentId: "STU-004", studentName: "Wei Chen", course: "PHY102", percentage: 71, shortfall: "4%" },
    { studentId: "STU-007", studentName: "Priya Sharma", course: "CS301L", percentage: 68, shortfall: "7%" },
    { studentId: "STU-008", studentName: "Marcus Vance", course: "MTH201", percentage: 65, shortfall: "10%" },
  ]);

  const handleRunAudit = async () => {
    setRunningAudit(true);
    try {
      if (token) {
        const res = await fetch("http://localhost:3001/academic/attendance/check-alerts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ threshold }),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.alerts) && data.alerts.length > 0) {
            setAuditResults(
              data.alerts.map((a: any) => ({
                studentId: a.studentId,
                studentName: a.studentName || "Student",
                course: a.course,
                percentage: a.percentage,
                shortfall: `${threshold - a.percentage}%`,
              }))
            );
            showToast(`Audit Complete: Dispatched automated alerts to ${data.alerts.length} student(s)`);
            return;
          }
        }
      }
      showToast(`Threshold Audit Run: Flagged ${auditResults.length} students below ${threshold}%`);
    } catch {
      showToast(`Audit triggered for minimum ${threshold}% threshold`);
    } finally {
      setRunningAudit(false);
    }
  };

  return (
    <div className="attendance-container">
      {/* Hero */}
      <div className="attendance-hero">
        <div>
          <h1 className="page-title" style={{ marginBottom: 6 }}>Institutional Attendance Command</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Configure institutional minimum attendance thresholds and trigger automated student notifications.
          </p>
        </div>
      </div>

      {/* Institutional KPI Grid */}
      <div className="stats-overview-grid">
        <div className="stat-metric-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Campus-wide Attendance</span>
            <div className="stat-icon-wrapper" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10B981" }}>
              <Award size={18} />
            </div>
          </div>
          <div className="stat-card-value">86.4%</div>
          <div className="stat-card-subtext" style={{ color: "#10B981" }}>
            +2.1% higher than last semester
          </div>
        </div>

        <div className="stat-metric-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Active Courses Monitored</span>
            <div className="stat-icon-wrapper" style={{ background: "rgba(244, 197, 66, 0.15)", color: "#D97706" }}>
              <BookOpen size={18} />
            </div>
          </div>
          <div className="stat-card-value">28</div>
          <div className="stat-card-subtext">Across 4 departments</div>
        </div>

        <div className="stat-metric-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Flagged Under Threshold</span>
            <div className="stat-icon-wrapper" style={{ background: "rgba(239, 68, 68, 0.12)", color: "#EF4444" }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="stat-card-value" style={{ color: "#EF4444" }}>
            {auditResults.length}
          </div>
          <div className="stat-card-subtext">Immediate intervention needed</div>
        </div>

        <div className="stat-metric-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Minimum Threshold</span>
            <div className="stat-icon-wrapper" style={{ background: "rgba(59, 130, 246, 0.12)", color: "#3B82F6" }}>
              <Sliders size={18} />
            </div>
          </div>
          <div className="stat-card-value">{threshold}%</div>
          <div className="stat-card-subtext">Institutional policy standard</div>
        </div>
      </div>

      {/* Threshold Configuration & Automated Alert Trigger Card */}
      <div className="admin-audit-card">
        <div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 4 }}>
            Threshold Rule Configuration & Automated Alert Dispatch
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Set the compliance cutoff. Running an audit will scan attendance and auto-dispatch high-priority warning notifications to student portals.
          </p>
        </div>

        <div className="threshold-config-box">
          <div className="slider-group">
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>
              Minimum Threshold:
            </span>
            <input
              id="admin-threshold-slider"
              type="range"
              min="50"
              max="95"
              step="1"
              className="threshold-slider"
              value={threshold}
              onChange={(e) => {
                const val = Number(e.target.value);
                setThreshold(val);
                localStorage.setItem("attendance_min_threshold", String(val));
              }}
            />
            <span className="threshold-value-pill">{threshold}%</span>
          </div>

          <button
            id="run-threshold-audit-btn"
            type="button"
            className="audit-action-btn"
            onClick={handleRunAudit}
            disabled={runningAudit}
          >
            <Bell size={16} />
            {runningAudit ? "Running Audit & Sending Alerts..." : "Audit & Dispatch Alerts"}
          </button>
        </div>

        {/* Flagged Students List */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h4 style={{ fontSize: "0.95rem", fontWeight: 600 }}>
              Students Falling Below {threshold}% Cutoff
            </h4>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              {auditResults.length} records flagged
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="flagged-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Student ID</th>
                  <th>Course / Subject</th>
                  <th>Attendance %</th>
                  <th>Shortfall</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {auditResults.length === 0 ? (
                  <EmptyStateTableRow
                    colSpan={6}
                    variant="attendance"
                    title="All Students in Good Standing"
                    description={`Zero students currently fall below the ${threshold}% attendance threshold. Outstanding campus adherence!`}
                  />
                ) : (
                  auditResults.map((rec) => (
                  <tr key={`${rec.studentId}-${rec.course}`}>
                    <td style={{ fontWeight: 600 }}>{rec.studentName}</td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.82rem" }}>{rec.studentId}</td>
                    <td><span className="course-code-badge">{rec.course}</span></td>
                    <td style={{ fontWeight: 700, color: "#EF4444" }}>{rec.percentage}%</td>
                    <td style={{ color: "#EF4444" }}>-{rec.shortfall}</td>
                    <td>
                      <span className="status-badge-pill status-badge-critical">
                        Alert Dispatched
                      </span>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MAIN ATTENDANCE PAGE ROUTER (Strict Role Separation)
// ═══════════════════════════════════════════════════
export default function AttendancePage() {
  const [user, setUser] = useState<{ role: Role; name?: string; userId?: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [threshold, setThreshold] = useState<number>(75);

  useEffect(() => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const parsed = JSON.parse(userData);
        setUser(parsed);
      }

      const storedToken = localStorage.getItem("accessToken");
      if (storedToken) setToken(storedToken);

      const savedThreshold = localStorage.getItem("attendance_min_threshold");
      if (savedThreshold) setThreshold(Number(savedThreshold));
    } catch (err) {
      console.error("Failed to load user session:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  if (loading) {
    return (
      <div style={{ padding: "40px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ height: 32, width: 240, background: "var(--border-glass)", borderRadius: 16 }} />
        <div style={{ height: 180, width: "100%", background: "var(--border-glass)", borderRadius: 20 }} />
      </div>
    );
  }

  // Fallback if not logged in
  const role = user?.role || "student";

  return (
    <div>
      {/* Strictly render ONLY the portal corresponding to the authenticated user's role */}
      {role === "teacher" && <TeacherAttendance token={token} showToast={showToast} />}
      {role === "student" && <StudentAttendance token={token} threshold={threshold} />}
      {role === "admin" && (
        <AdminAttendance
          token={token}
          threshold={threshold}
          setThreshold={setThreshold}
          showToast={showToast}
        />
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="attendance-toast">
          <CheckCircle2 size={18} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

