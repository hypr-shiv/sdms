"use client";

import { useState, useEffect, useMemo } from "react";
import { type Role } from "@/lib/mockData";
import {
  Download, Save, RefreshCw, Lock, Send, Printer, History,
  BookOpen, Award, TrendingUp, BarChart3, ChevronDown, Settings2
} from "lucide-react";
import "./grades.css";
import "../dashboard.css";
import EmptyState, { EmptyStateTableRow } from "@/components/UI/EmptyState";

const API = "http://localhost:3001";

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ═══════════════════════════════════════════════════
// GPA GAUGE COMPONENT
// ═══════════════════════════════════════════════════
function GPAGauge({ value, max, label, size = 160, color = "#6366f1" }: {
  value: number; max: number; label: string; size?: number; color?: string;
}) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(value / max, 1);
  const offset = circumference * (1 - pct);

  return (
    <div className="gpa-gauge-wrap" style={{ width: size, height: size }}>
      <svg className="gpa-gauge-svg" width={size} height={size}>
        <circle className="gpa-gauge-track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} />
        <circle
          className="gpa-gauge-fill"
          cx={size / 2} cy={size / 2} r={radius}
          strokeWidth={strokeWidth}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="gpa-gauge-center">
        <span className="gpa-gauge-value">{value.toFixed(2)}</span>
        <span className="gpa-gauge-label">{label}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// GRADE BADGE HELPER
// ═══════════════════════════════════════════════════
function GradeBadge({ grade }: { grade: string }) {
  let cls = "grade-f";
  if (grade?.startsWith("A")) cls = "grade-a";
  else if (grade?.startsWith("B")) cls = "grade-b";
  else if (grade?.startsWith("C")) cls = "grade-c";
  else if (grade?.startsWith("D")) cls = "grade-d";
  return <span className={`grade-badge ${cls}`}>{grade}</span>;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`status-badge ${status}`}>
      <span className="status-dot" />
      {status}
    </span>
  );
}

// ═══════════════════════════════════════════════════
// STUDENT GRADEBOOK VIEW
// ═══════════════════════════════════════════════════
function StudentGradebook({ userId }: { userId: string }) {
  const [gpaData, setGpaData] = useState<any>(null);
  const [reportCard, setReportCard] = useState<any>(null);
  const [gradebook, setGradebook] = useState<any[]>([]);
  const [auditTrail, setAuditTrail] = useState<any[]>([]);
  const [scale, setScale] = useState("4.0");
  const [showReport, setShowReport] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, [scale]);

  async function fetchAll() {
    setLoading(true);
    try {
      const [gbRes, gpaRes, rcRes] = await Promise.all([
        fetch(`${API}/academic/gradebook`, { headers: authHeaders() }),
        fetch(`${API}/academic/gpa/${userId}?scale=${scale}`, { headers: authHeaders() }),
        fetch(`${API}/academic/report-card/${userId}?semester=FA26`, { headers: authHeaders() }),
      ]);
      const gb = await gbRes.json();
      const gpa = await gpaRes.json();
      const rc = await rcRes.json();
      setGradebook(Array.isArray(gb) ? gb : []);
      setGpaData(gpa);
      setReportCard(rc);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function fetchAudit() {
    try {
      // Students can see their own audit trail via the gradebook entries
      const res = await fetch(`${API}/academic/gradebook`, { headers: authHeaders() });
      const data = await res.json();
      setAuditTrail(data);
    } catch (e) { console.error(e); }
  }

  const currentSemEntries = gradebook.filter(e => e.semester === "FA26");
  const prevSemEntries = gradebook.filter(e => e.semester !== "FA26");
  const maxGPA = scale === "4.0" ? 4.0 : scale === "10.0" ? 10.0 : 100;
  const scaleLabel = scale === "4.0" ? "/ 4.0" : scale === "10.0" ? "/ 10.0" : "%";

  if (loading) return <div style={{ padding: 32 }}>Loading gradebook...</div>;

  return (
    <div className="gradebook-container">
      {/* ─── Hero ─── */}
      <div className="gradebook-hero">
        <div>
          <h1>Academic Gradebook</h1>
          <p>Your comprehensive grade transcript, GPA analytics, and downloadable report card.</p>
        </div>
        <div className="gradebook-hero-actions">
          <div className="scale-toggle">
            {["4.0", "10.0", "percentage"].map(s => (
              <button key={s} className={scale === s ? "active" : ""} onClick={() => setScale(s)}>
                {s === "4.0" ? "4.0 Scale" : s === "10.0" ? "10.0 Scale" : "Percentage"}
              </button>
            ))}
          </div>
          <button className="gb-btn" onClick={() => { setShowAudit(!showAudit); if (!showAudit) fetchAudit(); }}>
            <History size={16} /> History
          </button>
          <button className="gb-btn primary" onClick={() => setShowReport(!showReport)}>
            <Printer size={16} /> Report Card
          </button>
        </div>
      </div>

      {/* ─── GPA Dashboard ─── */}
      {gpaData && (
        <>
          <div className="gpa-cards-row">
            <div className="gpa-stat-card" style={{ alignItems: "center", justifyContent: "center", padding: 28 }}>
              <GPAGauge value={gpaData.cumulativeGPA} max={maxGPA} label={`Cumulative ${scaleLabel}`} size={150} color="#6366f1" />
            </div>
            <div className="gpa-stat-card" style={{ alignItems: "center", justifyContent: "center", padding: 28 }}>
              <GPAGauge value={gpaData.semesterGPA || gpaData.cumulativeGPA} max={maxGPA} label={`Fall 2026 ${scaleLabel}`} size={150} color="#f59e0b" />
            </div>
            <div className="gpa-stat-card">
              <span className="stat-label">Total Credits</span>
              <span className="stat-value">{gpaData.totalCredits}</span>
              <span className="stat-sub">across {gpaData.totalCourses} courses</span>
            </div>
            <div className="gpa-stat-card">
              <span className="stat-label">Semesters</span>
              <span className="stat-value">{gpaData.semesters?.length || 0}</span>
              <span className="stat-sub">academic terms completed</span>
            </div>
          </div>

          {/* ─── Semester Trend ─── */}
          {gpaData.semesters && gpaData.semesters.length > 1 && (
            <div className="gb-card">
              <div className="gb-card-header">
                <span className="gb-card-title"><TrendingUp size={16} style={{ marginRight: 8 }} />GPA Trend</span>
              </div>
              <div className="semester-trend">
                {gpaData.semesters.map((sem: any, i: number) => (
                  <div key={sem.semester} className="trend-bar-wrap">
                    <span className="trend-value">{sem.gpa.toFixed(2)}</span>
                    <div
                      className={`trend-bar ${i === gpaData.semesters.length - 1 ? "current" : "past"}`}
                      style={{ height: `${(sem.gpa / maxGPA) * 100}%` }}
                    />
                    <span className="trend-label">{sem.semester}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── Current Semester Course Grades ─── */}
      <div className="gb-card" style={{ padding: 0 }}>
        <div className="gb-card-header" style={{ padding: "16px 24px" }}>
          <span className="gb-card-title"><BookOpen size={16} style={{ marginRight: 8 }} />Fall 2026 — Course Grades</span>
        </div>
        <div className="table-wrapper">
          <table className="gradebook-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 24 }}>Course</th>
                <th>Credits</th>
                <th className="score-cell">Assignments</th>
                <th className="score-cell">Midterm</th>
                <th className="score-cell">Final</th>
                <th className="score-cell">Participation</th>
                <th className="score-cell">Quiz</th>
                <th className="score-cell">Weighted %</th>
                <th>Grade</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {currentSemEntries.length === 0 ? (
                <EmptyStateTableRow
                  colSpan={10}
                  variant="grades"
                  title="No Grades Posted for Fall 2026"
                  description="Evaluations and weighted percentages will appear as soon as coursework assessments are published by instructors."
                  action={{
                    label: "Explore Course Catalog",
                    href: "/dashboard/courses",
                    icon: <BookOpen size={14} />,
                  }}
                />
              ) : (
                currentSemEntries.map(entry => (
                <tr key={entry.id}>
                  <td style={{ paddingLeft: 24 }}>
                    <div style={{ fontWeight: 600 }}>{entry.courseName}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{entry.courseCode}</div>
                  </td>
                  <td>{entry.credits}</td>
                  <td className="score-cell">{entry.assignmentScore ?? "—"}</td>
                  <td className="score-cell">{entry.midtermScore ?? "—"}</td>
                  <td className="score-cell">{entry.finalScore ?? "—"}</td>
                  <td className="score-cell">{entry.participationScore ?? "—"}</td>
                  <td className="score-cell">{entry.quizScore ?? "—"}</td>
                  <td className="score-cell" style={{ fontWeight: 700 }}>{entry.weightedTotal?.toFixed(1)}</td>
                  <td><GradeBadge grade={entry.letterGrade} /></td>
                  <td><StatusBadge status={entry.status} /></td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Previous Semester Grades ─── */}
      {prevSemEntries.length > 0 && (
        <div className="gb-card" style={{ padding: 0 }}>
          <div className="gb-card-header" style={{ padding: "16px 24px" }}>
            <span className="gb-card-title"><Award size={16} style={{ marginRight: 8 }} />Previous Semesters</span>
          </div>
          <div className="table-wrapper">
            <table className="gradebook-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 24 }}>Course</th>
                  <th>Semester</th>
                  <th>Credits</th>
                  <th className="score-cell">Weighted %</th>
                  <th>Grade</th>
                  <th>Points</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {prevSemEntries.map(entry => (
                  <tr key={entry.id}>
                    <td style={{ paddingLeft: 24 }}>
                      <div style={{ fontWeight: 600 }}>{entry.courseName}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{entry.courseCode}</div>
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>{entry.semester}</td>
                    <td>{entry.credits}</td>
                    <td className="score-cell" style={{ fontWeight: 600 }}>{entry.weightedTotal?.toFixed(1)}</td>
                    <td><GradeBadge grade={entry.letterGrade} /></td>
                    <td style={{ fontWeight: 600 }}>{entry.gradePoints?.toFixed(1)}</td>
                    <td><StatusBadge status={entry.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Category Breakdown (first current course) ─── */}
      {currentSemEntries.length > 0 && (
        <div className="gb-card">
          <div className="gb-card-header">
            <span className="gb-card-title"><BarChart3 size={16} style={{ marginRight: 8 }} />Score Breakdown — {currentSemEntries[0].courseName}</span>
          </div>
          <div className="category-breakdown">
            {[
              { label: "Assignments", key: "assignmentScore", cls: "assignments" },
              { label: "Midterm", key: "midtermScore", cls: "midterm" },
              { label: "Final Exam", key: "finalScore", cls: "final" },
              { label: "Participation", key: "participationScore", cls: "participation" },
              { label: "Quizzes", key: "quizScore", cls: "quiz" },
            ].map(cat => {
              const score = currentSemEntries[0][cat.key];
              const weights = JSON.parse(currentSemEntries[0].categoryWeights || "{}");
              const weightKey = cat.cls === "assignments" ? "assignments" : cat.cls;
              return (
                <div key={cat.key} className="category-row">
                  <span className="category-label">{cat.label}</span>
                  <div className="category-bar-track">
                    <div className={`category-bar-fill ${cat.cls}`} style={{ width: `${score || 0}%` }} />
                  </div>
                  <span className="category-score">{score ?? "—"}</span>
                  <span className="category-weight">{weights[weightKey]}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Report Card Modal ─── */}
      {showReport && reportCard && (
        <div className="report-card-print" id="report-card-printable">
          <div className="gb-card-header" style={{ marginBottom: 0 }}>
            <span className="gb-card-title">Official Report Card</span>
            <button className="gb-btn" onClick={() => window.print()}>
              <Download size={16} /> Print / Save PDF
            </button>
          </div>

          <div className="report-header" style={{ marginTop: 16 }}>
            <div className="institution">{reportCard.institution}</div>
            <div className="department">{reportCard.department}</div>
            <div className="doc-title">Academic Report Card — {reportCard.semester}</div>
          </div>

          <div className="report-meta">
            <div className="meta-item"><span className="meta-label">Student:</span><span className="meta-value">{reportCard.studentName}</span></div>
            <div className="meta-item"><span className="meta-label">Student ID:</span><span className="meta-value">{reportCard.studentId}</span></div>
            <div className="meta-item"><span className="meta-label">Semester:</span><span className="meta-value">{reportCard.semester}</span></div>
            <div className="meta-item"><span className="meta-label">Generated:</span><span className="meta-value">{new Date(reportCard.generatedAt).toLocaleDateString()}</span></div>
          </div>

          <table className="report-card-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Course Name</th>
                <th>Credits</th>
                <th>Assign.</th>
                <th>Midterm</th>
                <th>Final</th>
                <th>Weighted %</th>
                <th>Grade</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {(reportCard.courses || []).map((c: any, i: number) => (
                <tr key={i}>
                  <td style={{ textAlign: "left", fontWeight: 600 }}>{c.courseCode}</td>
                  <td style={{ textAlign: "left" }}>{c.courseName}</td>
                  <td>{c.credits}</td>
                  <td>{c.categories?.assignments?.score ?? "—"}</td>
                  <td>{c.categories?.midterm?.score ?? "—"}</td>
                  <td>{c.categories?.final?.score ?? "—"}</td>
                  <td style={{ fontWeight: 600 }}>{c.weightedTotal?.toFixed(1)}</td>
                  <td><GradeBadge grade={c.letterGrade} /></td>
                  <td style={{ fontWeight: 600 }}>{c.gradePoints?.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="report-summary">
            <div className="report-summary-item">
              <div className="label">Semester GPA</div>
              <div className="value">{reportCard.semesterGPA?.toFixed(2) || "—"}</div>
            </div>
            <div className="report-summary-item">
              <div className="label">Cumulative GPA</div>
              <div className="value">{reportCard.cumulativeGPA?.toFixed(2)}</div>
            </div>
            <div className="report-summary-item">
              <div className="label">Attendance</div>
              <div className="value">{reportCard.attendance?.percent}%</div>
            </div>
          </div>

          <div className="report-footer">
            <div>
              <div className="report-stamp">ScholarPulse University — Registrar&apos;s Office</div>
              <div>This is a digitally generated academic record.</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="report-stamp">AUTH-CODE-{Math.random().toString(36).substring(2, 12).toUpperCase()}</div>
              <div>Valid as of {new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Audit Trail (grade history) ─── */}
      {showAudit && (
        <div className="gb-card">
          <div className="gb-card-header">
            <span className="gb-card-title"><History size={16} style={{ marginRight: 8 }} />Grade Change History</span>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 12 }}>
            Grade changes across your enrolled courses are logged here for transparency.
          </p>
          <div className="audit-timeline">
            {currentSemEntries.length > 0 ? currentSemEntries.map((entry: any) => (
              <div key={entry.id} className="audit-entry">
                <div className="audit-icon">📝</div>
                <div className="audit-content">
                  <div className="audit-title">{entry.courseName} — Grade {entry.status === "published" ? "Published" : entry.status === "finalized" ? "Finalized" : "Pending"}</div>
                  <div className="audit-detail">Weighted: {entry.weightedTotal?.toFixed(1)}% → {entry.letterGrade} ({entry.gradePoints?.toFixed(1)} pts)</div>
                </div>
                <span className="audit-timestamp">{entry.status}</span>
              </div>
            )) : (
              <div style={{ padding: 16, color: "var(--text-secondary)", fontSize: "0.85rem" }}>No grade history available.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// TEACHER GRADEBOOK VIEW
// ═══════════════════════════════════════════════════
function TeacherGradebook() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [entries, setEntries] = useState<any[]>([]);
  const [auditTrail, setAuditTrail] = useState<any[]>([]);
  const [showAudit, setShowAudit] = useState(false);
  const [showWeights, setShowWeights] = useState(false);
  const [weights, setWeights] = useState({ assignments: 30, midterm: 20, final: 35, participation: 10, quiz: 5 });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) fetchGradebook();
  }, [selectedCourse]);

  async function fetchCourses() {
    try {
      const res = await fetch(`${API}/academic/attendance/courses`, { headers: authHeaders() });
      const data = await res.json();
      const courseList = Array.isArray(data) ? data : [];
      setCourses(courseList);
      if (courseList.length > 0) setSelectedCourse(courseList[0].code);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function fetchGradebook() {
    try {
      const res = await fetch(`${API}/academic/gradebook/${selectedCourse}`, { headers: authHeaders() });
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
      // Parse weights from first entry if available
      if (Array.isArray(data) && data.length > 0) {
        try {
          const w = JSON.parse(data[0].categoryWeights);
          setWeights(w);
        } catch {}
      }
    } catch (e) { console.error(e); }
  }

  async function fetchAudit() {
    try {
      const res = await fetch(`${API}/academic/grade-audit?courseCode=${selectedCourse}`, { headers: authHeaders() });
      const data = await res.json();
      setAuditTrail(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  }

  function handleScoreChange(entryId: string, field: string, value: string) {
    const num = value === "" ? null : parseFloat(value);
    if (num !== null && (isNaN(num) || num < 0 || num > 100)) return;
    setEntries(prev => prev.map(e => e.id === entryId ? { ...e, [field]: num } : e));
    setDirty(true);
  }

  async function saveAllGrades() {
    setSaving(true);
    for (const entry of entries) {
      try {
        await fetch(`${API}/academic/gradebook/entry/${entry.id}`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            assignmentScore: entry.assignmentScore,
            midtermScore: entry.midtermScore,
            finalScore: entry.finalScore,
            participationScore: entry.participationScore,
            quizScore: entry.quizScore,
          }),
        });
      } catch (e) { console.error(e); }
    }
    setDirty(false);
    setSaving(false);
    fetchGradebook();
  }

  async function syncFromSources() {
    try {
      await fetch(`${API}/academic/gradebook/sync/${selectedCourse}`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ semester: "FA26" }),
      });
      fetchGradebook();
    } catch (e) { console.error(e); }
  }

  async function publishGrades() {
    try {
      await fetch(`${API}/academic/gradebook/publish`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ courseCode: selectedCourse, semester: "FA26" }),
      });
      fetchGradebook();
    } catch (e) { console.error(e); }
  }

  async function saveWeights() {
    try {
      await fetch(`${API}/academic/gradebook/configure-weights`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ courseCode: selectedCourse, semester: "FA26", weights }),
      });
      fetchGradebook();
      setShowWeights(false);
    } catch (e) { console.error(e); }
  }

  const weightsTotal = weights.assignments + weights.midterm + weights.final + weights.participation + weights.quiz;
  const draftCount = entries.filter(e => e.status === "draft").length;
  const publishedCount = entries.filter(e => e.status === "published").length;
  const courseName = courses.find(c => c.code === selectedCourse)?.name || selectedCourse;

  if (loading) return <div style={{ padding: 32 }}>Loading gradebook...</div>;

  return (
    <div className="gradebook-container">
      {/* ─── Hero ─── */}
      <div className="gradebook-hero">
        <div>
          <h1>Course Gradebook</h1>
          <p>Centralized grade management with weighted categories, sync, and publication.</p>
        </div>
        <div className="gradebook-hero-actions">
          <select
            className="course-select"
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
            style={{ minWidth: 220 }}
          >
            {courses.map(c => (
              <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
            ))}
          </select>
          <button className="gb-btn" onClick={syncFromSources} title="Auto-sync from assignments & exams">
            <RefreshCw size={16} /> Sync
          </button>
          <button className="gb-btn" onClick={() => { setShowWeights(!showWeights); }} title="Configure category weights">
            <Settings2 size={16} /> Weights
          </button>
          <button className="gb-btn" onClick={() => { setShowAudit(!showAudit); if (!showAudit) fetchAudit(); }}>
            <History size={16} /> Audit
          </button>
        </div>
      </div>

      {/* ─── Stats Row ─── */}
      <div className="gpa-cards-row">
        <div className="gpa-stat-card">
          <span className="stat-label">Students</span>
          <span className="stat-value">{entries.length}</span>
          <span className="stat-sub">enrolled in {courseName}</span>
        </div>
        <div className="gpa-stat-card">
          <span className="stat-label">Draft</span>
          <span className="stat-value">{draftCount}</span>
          <span className="stat-sub">awaiting publication</span>
        </div>
        <div className="gpa-stat-card">
          <span className="stat-label">Published</span>
          <span className="stat-value">{publishedCount}</span>
          <span className="stat-sub">visible to students</span>
        </div>
        <div className="gpa-stat-card">
          <span className="stat-label">Class Avg</span>
          <span className="stat-value">
            {entries.length > 0
              ? (entries.reduce((s, e) => s + (e.weightedTotal || 0), 0) / entries.length).toFixed(1)
              : "—"}%
          </span>
          <span className="stat-sub">weighted average</span>
        </div>
      </div>

      {/* ─── Weight Configuration ─── */}
      {showWeights && (
        <div className="gb-card">
          <div className="gb-card-header">
            <span className="gb-card-title"><Settings2 size={16} style={{ marginRight: 8 }} />Category Weight Configuration</span>
            <button className="gb-btn primary" onClick={saveWeights} disabled={Math.abs(weightsTotal - 100) > 0.01}>
              <Save size={16} /> Apply Weights
            </button>
          </div>
          <div className="weight-config-panel">
            {[
              { key: "assignments", label: "Assignments", color: "#6366f1" },
              { key: "midterm", label: "Midterm Exam", color: "#f59e0b" },
              { key: "final", label: "Final Exam", color: "#ef4444" },
              { key: "participation", label: "Participation", color: "#10b981" },
              { key: "quiz", label: "Quizzes", color: "#8b5cf6" },
            ].map(cat => (
              <div key={cat.key} className="weight-row">
                <span className="weight-label">{cat.label}</span>
                <input
                  type="range"
                  className="weight-slider"
                  min={0} max={100}
                  value={(weights as any)[cat.key]}
                  onChange={e => setWeights(prev => ({ ...prev, [cat.key]: parseInt(e.target.value) }))}
                  style={{ background: `linear-gradient(to right, ${cat.color} ${(weights as any)[cat.key]}%, rgba(0,0,0,0.08) ${(weights as any)[cat.key]}%)` }}
                />
                <span className="weight-value">{(weights as any)[cat.key]}%</span>
              </div>
            ))}
            <div className={`weight-total ${Math.abs(weightsTotal - 100) <= 0.01 ? "valid" : "invalid"}`}>
              Total: {weightsTotal}% {Math.abs(weightsTotal - 100) <= 0.01 ? "✓" : `(must be 100%)`}
            </div>
          </div>
        </div>
      )}

      {/* ─── Gradebook Table ─── */}
      <div className="gb-card" style={{ padding: 0 }}>
        <div className="gb-card-header" style={{ padding: "16px 24px" }}>
          <span className="gb-card-title">{courseName} — Student Gradebook</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="gb-btn" onClick={saveAllGrades} disabled={!dirty || saving}>
              <Save size={16} /> {saving ? "Saving..." : dirty ? "Save Changes" : "Saved"}
            </button>
            {draftCount > 0 && (
              <button className="gb-btn success" onClick={publishGrades}>
                <Send size={16} /> Publish {draftCount} Drafts
              </button>
            )}
          </div>
        </div>
        <div className="table-wrapper">
          <table className="gradebook-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 24 }}>Student</th>
                <th className="score-cell">Assignments ({weights.assignments}%)</th>
                <th className="score-cell">Midterm ({weights.midterm}%)</th>
                <th className="score-cell">Final ({weights.final}%)</th>
                <th className="score-cell">Participation ({weights.participation}%)</th>
                <th className="score-cell">Quiz ({weights.quiz}%)</th>
                <th className="score-cell">Weighted %</th>
                <th>Grade</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <EmptyStateTableRow
                  colSpan={9}
                  variant="grades"
                  title="No Student Grade Entries"
                  description={`No student grade records found for ${courseName}. Click "Sync" to auto-import students and coursework.`}
                  action={{
                    label: "Sync from Courses & Exams",
                    onClick: syncFromSources,
                    icon: <RefreshCw size={14} />,
                  }}
                />
              ) : (
                entries.map(entry => (
                <tr key={entry.id}>
                  <td style={{ paddingLeft: 24 }}>
                    <div style={{ fontWeight: 600 }}>{entry.studentName}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{entry.studentId}</div>
                  </td>
                  {["assignmentScore", "midtermScore", "finalScore", "participationScore", "quizScore"].map(field => (
                    <td key={field} className="score-cell">
                      <input
                        type="text"
                        value={entry[field] === null || entry[field] === undefined ? "" : entry[field]}
                        onChange={e => handleScoreChange(entry.id, field, e.target.value)}
                        placeholder="—"
                        disabled={entry.status === "finalized"}
                      />
                    </td>
                  ))}
                  <td className="score-cell" style={{ fontWeight: 700, fontSize: "1rem" }}>{entry.weightedTotal?.toFixed(1) ?? "—"}</td>
                  <td><GradeBadge grade={entry.letterGrade} /></td>
                  <td><StatusBadge status={entry.status} /></td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Audit Trail ─── */}
      {showAudit && (
        <div className="gb-card">
          <div className="gb-card-header">
            <span className="gb-card-title"><History size={16} style={{ marginRight: 8 }} />Grade Audit Trail — {selectedCourse}</span>
          </div>
          <div className="audit-timeline">
            {auditTrail.length > 0 ? auditTrail.map((a: any) => (
              <div key={a.id} className="audit-entry">
                <div className="audit-icon">📋</div>
                <div className="audit-content">
                  <div className="audit-title">
                    {a.changedByName || a.changedBy} changed <strong>{a.field}</strong> for {a.studentId}
                  </div>
                  <div className="audit-diff">
                    <span className="old-val">{a.oldValue}</span>
                    <span className="arrow">→</span>
                    <span className="new-val">{a.newValue}</span>
                  </div>
                  {a.reason && <div className="audit-detail">Reason: {a.reason}</div>}
                </div>
                <span className="audit-timestamp">{new Date(a.timestamp).toLocaleString()}</span>
              </div>
            )) : (
              <div style={{ padding: 16, color: "var(--text-secondary)", fontSize: "0.85rem" }}>No audit records found for this course.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// ADMIN GRADEBOOK VIEW
// ═══════════════════════════════════════════════════
function AdminGradebook() {
  const [gradebook, setGradebook] = useState<any[]>([]);
  const [auditTrail, setAuditTrail] = useState<any[]>([]);
  const [showAudit, setShowAudit] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    try {
      const [gbRes, auditRes] = await Promise.all([
        fetch(`${API}/academic/gradebook`, { headers: authHeaders() }),
        fetch(`${API}/academic/grade-audit`, { headers: authHeaders() }),
      ]);
      const gb = await gbRes.json();
      const audit = await auditRes.json();
      setGradebook(Array.isArray(gb) ? gb : []);
      setAuditTrail(Array.isArray(audit) ? audit : []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function finalizeGrades(courseCode: string) {
    try {
      await fetch(`${API}/academic/gradebook/finalize`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ courseCode, semester: "FA26" }),
      });
      fetchAll();
    } catch (e) { console.error(e); }
  }

  // Aggregate stats
  const courseMap = useMemo(() => {
    const map: Record<string, { entries: any[]; name: string }> = {};
    gradebook.forEach(e => {
      if (!map[e.courseCode]) map[e.courseCode] = { entries: [], name: e.courseName || e.courseCode };
      map[e.courseCode].entries.push(e);
    });
    return map;
  }, [gradebook]);

  const totalStudents = new Set(gradebook.map(e => e.studentId)).size;
  const allWeighted = gradebook.filter(e => e.weightedTotal != null).map(e => e.weightedTotal!);
  const avgGPA = allWeighted.length > 0 ? (allWeighted.reduce((a, b) => a + b, 0) / allWeighted.length).toFixed(1) : "—";
  const publishedCount = gradebook.filter(e => e.status === "published").length;
  const finalizedCount = gradebook.filter(e => e.status === "finalized").length;
  const honorRoll = gradebook.filter(e => e.weightedTotal && e.weightedTotal >= 90).length;

  if (loading) return <div style={{ padding: 32 }}>Loading institutional data...</div>;

  return (
    <div className="gradebook-container">
      {/* ─── Hero ─── */}
      <div className="gradebook-hero">
        <div>
          <h1>Institutional Grade Analytics</h1>
          <p>Institution-wide grade oversight, finalization controls, and audit compliance.</p>
        </div>
        <div className="gradebook-hero-actions">
          <button className="gb-btn" onClick={() => setShowAudit(!showAudit)}>
            <History size={16} /> Audit Log
          </button>
        </div>
      </div>

      {/* ─── Analytics Cards ─── */}
      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="a-value">{totalStudents}</div>
          <div className="a-label">Total Students</div>
        </div>
        <div className="analytics-card">
          <div className="a-value">{avgGPA}%</div>
          <div className="a-label">Institution Avg Score</div>
        </div>
        <div className="analytics-card">
          <div className="a-value">{Object.keys(courseMap).length}</div>
          <div className="a-label">Active Courses</div>
        </div>
        <div className="analytics-card">
          <div className="a-value">{honorRoll}</div>
          <div className="a-label">Honor Roll (≥90%)</div>
        </div>
        <div className="analytics-card">
          <div className="a-value">{publishedCount}</div>
          <div className="a-label">Published Grades</div>
        </div>
        <div className="analytics-card">
          <div className="a-value">{finalizedCount}</div>
          <div className="a-label">Finalized Grades</div>
        </div>
      </div>

      {/* ─── Per-Course Breakdown ─── */}
      {Object.entries(courseMap).map(([code, { entries: courseEntries, name }]) => {
        const avg = courseEntries.filter(e => e.weightedTotal != null);
        const avgScore = avg.length > 0 ? (avg.reduce((s, e) => s + e.weightedTotal, 0) / avg.length).toFixed(1) : "—";
        const pass = avg.filter(e => e.weightedTotal >= 60).length;
        const passRate = avg.length > 0 ? Math.round((pass / avg.length) * 100) : 0;
        const drafted = courseEntries.filter(e => e.status === "draft").length;
        const published = courseEntries.filter(e => e.status === "published").length;
        const finalized = courseEntries.filter(e => e.status === "finalized").length;

        return (
          <div key={code} className="gb-card" style={{ padding: 0 }}>
            <div className="gb-card-header" style={{ padding: "16px 24px" }}>
              <div>
                <span className="gb-card-title">{name}</span>
                <span style={{ marginLeft: 8, fontSize: "0.8rem", color: "var(--text-secondary)" }}>{code}</span>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                  Avg: {avgScore}% | Pass: {passRate}% | Enrolled: {courseEntries.length}
                </span>
                {published > 0 && finalized === 0 && (
                  <button className="gb-btn danger" onClick={() => finalizeGrades(code)} style={{ padding: "6px 14px", fontSize: "0.8rem" }}>
                    <Lock size={14} /> Finalize {published}
                  </button>
                )}
                {finalized > 0 && (
                  <span className="status-badge finalized"><span className="status-dot" /> Finalized</span>
                )}
              </div>
            </div>
            <div className="table-wrapper">
              <table className="gradebook-table">
                <thead>
                  <tr>
                    <th style={{ paddingLeft: 24 }}>Student</th>
                    <th className="score-cell">Assignments</th>
                    <th className="score-cell">Midterm</th>
                    <th className="score-cell">Final</th>
                    <th className="score-cell">Weighted %</th>
                    <th>Grade</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {courseEntries.map(entry => (
                    <tr key={entry.id}>
                      <td style={{ paddingLeft: 24 }}>
                        <div style={{ fontWeight: 600 }}>{entry.studentName}</div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{entry.studentId}</div>
                      </td>
                      <td className="score-cell">{entry.assignmentScore ?? "—"}</td>
                      <td className="score-cell">{entry.midtermScore ?? "—"}</td>
                      <td className="score-cell">{entry.finalScore ?? "—"}</td>
                      <td className="score-cell" style={{ fontWeight: 700 }}>{entry.weightedTotal?.toFixed(1)}</td>
                      <td><GradeBadge grade={entry.letterGrade} /></td>
                      <td><StatusBadge status={entry.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* ─── Audit Trail ─── */}
      {showAudit && (
        <div className="gb-card">
          <div className="gb-card-header">
            <span className="gb-card-title"><History size={16} style={{ marginRight: 8 }} />Institutional Grade Audit Log</span>
          </div>
          <div className="audit-timeline">
            {auditTrail.length > 0 ? auditTrail.slice(0, 50).map((a: any) => (
              <div key={a.id} className="audit-entry">
                <div className="audit-icon">🔒</div>
                <div className="audit-content">
                  <div className="audit-title">
                    <strong>{a.changedByName || a.changedBy}</strong> changed <strong>{a.field}</strong> for {a.studentId} in {a.courseCode}
                  </div>
                  <div className="audit-diff">
                    <span className="old-val">{a.oldValue}</span>
                    <span className="arrow">→</span>
                    <span className="new-val">{a.newValue}</span>
                  </div>
                  {a.reason && <div className="audit-detail">Reason: {a.reason}</div>}
                </div>
                <span className="audit-timestamp">{new Date(a.timestamp).toLocaleString()}</span>
              </div>
            )) : (
              <div style={{ padding: 16, color: "var(--text-secondary)", fontSize: "0.85rem" }}>No audit records.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MAIN PAGE ROUTER
// ═══════════════════════════════════════════════════
export default function GradesPage() {
  const [user, setUser] = useState<{ role: Role; id: string; userId?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch {}
    setLoading(false);
  }, []);

  if (loading || !user) return <div style={{ padding: 32 }}>Loading grades...</div>;

  return (
    <>
      {user.role === "student" && <StudentGradebook userId={user.id || user.userId || ""} />}
      {user.role === "teacher" && <TeacherGradebook />}
      {user.role === "admin" && <AdminGradebook />}
    </>
  );
}
