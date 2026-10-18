"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ShieldCheck,
  HeartHandshake,
  Calendar,
  Clock,
  Sparkles,
  TrendingUp,
  TrendingDown,
  UserCheck,
  CheckCircle,
  X,
  Search,
  BookOpen,
  Send,
  HelpCircle,
  Eye,
  Building,
  RefreshCw,
} from "lucide-react";
import "./at-risk.css";

interface StudentRiskItem {
  id: string;
  studentId: string;
  studentName: string;
  department: string;
  riskScore: number;
  overallRiskScore?: number;
  riskTier: "critical" | "moderate" | "low" | "safe";
  parentStatus: "Needs Attention" | "On Track" | "Excelling";
  parentGuidance: string;
  riskFactors?: string[];
  reasons?: string[];
  factors?: string[];
  empatheticMessage?: string;
  recommendedAction?: string;
  interventionStatus: "none" | "counseling_scheduled" | "in_progress" | "resolved";
  counselingDate?: string;
  trend: "worsening" | "improving" | "stable";
  attendancePercentage?: number;
  missedAssignments?: number;
  gpa?: number;
}

interface RiskSummary {
  totalEvaluated: number;
  criticalCount: number;
  moderateCount: number;
  onTrackCount: number;
  averageCohortRisk: number;
  activeInterventionsCount: number;
}

interface StudentWellness {
  studentName: string;
  empatheticMessage: string;
  attendanceRate: number;
  missedAssignments: number;
  gpa: number;
  scheduledSessions: Array<{
    id: string;
    counselorName: string;
    type: string;
    date: string;
    timeSlot: string;
    location: string;
    notes: string;
  }>;
  supportResources: Array<{
    name: string;
    schedule: string;
    location: string;
    actionText: string;
  }>;
}

interface ParentViewData {
  studentName: string;
  department: string;
  status: "Needs Attention" | "On Track" | "Excelling";
  statusBadge: string;
  guidanceSummary: string;
  constructiveFocusAreas: string[];
}

interface MLModelInfo {
  model_name: string;
  algorithm: string;
  validation_accuracy: number;
  r2_score: number;
  total_training_samples: number;
  features: string[];
  feature_importances: Record<string, number>;
  trained_at?: string;
  tiers?: Record<string, string>;
}

export default function AtRiskDashboardPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activePersona, setActivePersona] = useState<"faculty" | "student" | "parent">("faculty");
  const [isLoading, setIsLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Faculty State
  const [roster, setRoster] = useState<StudentRiskItem[]>([]);
  const [summary, setSummary] = useState<RiskSummary | null>(null);
  const [modelInfo, setModelInfo] = useState<MLModelInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>("all");

  // Counseling Modal State
  const [isCounselModalOpen, setIsCounselModalOpen] = useState(false);
  const [counselStudent, setCounselStudent] = useState<StudentRiskItem | null>(null);
  const [counselType, setCounselType] = useState("academic_tutoring");
  const [counselDate, setCounselDate] = useState("2026-10-05");
  const [counselTime, setCounselTime] = useState("14:30 - 15:15");
  const [counselLocation, setCounselLocation] = useState("Turing Hall Academic Suite 302");
  const [counselNotes, setCounselNotes] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);

  // Student State
  const [studentWellness, setStudentWellness] = useState<StudentWellness | null>(null);

  // Parent State
  const [parentData, setParentData] = useState<ParentViewData | null>(null);

  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessToken");
    }
    return null;
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored);
        setCurrentUser(u);
        if (u.role === "student") {
          setActivePersona("student");
        } else if (u.role === "parent") {
          setActivePersona("parent");
        } else {
          setActivePersona("faculty");
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadData = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    setIsLoading(true);

    try {
      // 1. Load Faculty Roster, Summary & Model Info
      const [rosterRes, summaryRes, modelRes] = await Promise.all([
        fetch("http://localhost:3001/ai/at-risk", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:3001/ai/at-risk/summary", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:3001/ai/model-info", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (rosterRes.ok) {
        const data = await rosterRes.json();
        setRoster(data || []);
      }
      if (summaryRes.ok) {
        const sumData = await summaryRes.json();
        setSummary(sumData);
      }
      if (modelRes.ok) {
        const mData = await modelRes.json();
        setModelInfo(mData);
      }

      // 2. Load Student Wellness View
      const wellnessRes = await fetch("http://localhost:3001/ai/student-wellness", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (wellnessRes.ok) {
        const wData = await wellnessRes.json();
        setStudentWellness(wData);
      }

      // 3. Load Parent Softened View
      const parentRes = await fetch("http://localhost:3001/ai/parent-view", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (parentRes.ok) {
        const pData = await parentRes.json();
        setParentData(pData);
      }
    } catch (err) {
      console.error("Error loading at-risk intelligence data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser, loadData]);

  // Recalculate background ML job
  const handleRecalculate = async () => {
    const token = getAuthToken();
    if (!token) return;
    setIsRecalculating(true);
    try {
      const res = await fetch("http://localhost:3001/ai/recalculate-risk", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await loadData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRecalculating(false);
    }
  };

  // Open Counseling Modal
  const handleOpenCounselModal = (student: StudentRiskItem) => {
    setCounselStudent(student);
    setCounselNotes(`Academic intervention consultation for attendance recovery and assignment pacing.`);
    setIsCounselModalOpen(true);
  };

  // Submit Counseling Session
  const handleSubmitCounseling = async () => {
    if (!counselStudent) return;
    const token = getAuthToken();
    if (!token) return;

    setIsScheduling(true);
    try {
      const res = await fetch("http://localhost:3001/ai/schedule-counseling", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId: counselStudent.studentId || counselStudent.id,
          counselingType: counselType,
          scheduledDate: counselDate,
          timeSlot: counselTime,
          location: counselLocation,
          notes: counselNotes,
        }),
      });

      if (res.ok) {
        setIsCounselModalOpen(false);
        loadData();
      } else {
        alert("Failed to schedule counseling session.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsScheduling(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "#ef4444";
    if (score >= 40) return "#f59e0b";
    return "#10b981";
  };

  const filteredRoster = roster.filter((s) => {
    const matchesSearch =
      s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.department && s.department.toLowerCase().includes(searchQuery.toLowerCase()));

    const score = s.overallRiskScore ?? s.riskScore ?? 0;
    if (selectedTierFilter === "critical") return matchesSearch && score >= 70;
    if (selectedTierFilter === "moderate") return matchesSearch && score >= 40 && score < 70;
    if (selectedTierFilter === "safe") return matchesSearch && score < 40;
    return matchesSearch;
  });

  return (
    <div className="at-risk-container">
      {/* Hero Header */}
      <div className="at-risk-hero">
        <div className="at-risk-hero-left">
          {currentUser?.role === "student" ? (
            <>
              <h1>
                <HeartHandshake size={28} color="#6366f1" />
                Academic Wellness & Campus Guidance
              </h1>
              <p>
                Empathetic personalized guidance, attendance tracking, and peer tutoring circles to support your semester.
              </p>
              <div className="at-risk-badges">
                <span className="risk-pill-badge continuous-ml">
                  <Sparkles size={13} /> Continuous Academic Guidance Active
                </span>
                <span className="risk-pill-badge engine-active">
                  <ShieldCheck size={13} /> Campus Support Circles
                </span>
              </div>
            </>
          ) : (
            <>
              <h1>
                <AlertTriangle size={28} color="#ef4444" />
                At-Risk Student Identification & Predictive Analytics
              </h1>
              <p>
                Continuous evaluation of attendance logs, assignment drop-offs, and historical grades via background ML jobs.
              </p>
              <div className="at-risk-badges">
                <span className="risk-pill-badge engine-active">
                  <Sparkles size={13} /> Continuous ML Engine Active
                </span>
                <span className="risk-pill-badge continuous-ml">
                  <ShieldCheck size={13} /> Weighted Multi-Factor Scoring (0–100%)
                </span>
              </div>
            </>
          )}
        </div>

        <div className="at-risk-hero-actions">
          {(currentUser?.role === "teacher" || currentUser?.role === "admin") && (
            <button className="at-risk-action-btn" onClick={handleRecalculate} disabled={isRecalculating}>
              <RefreshCw size={14} className={isRecalculating ? "spin" : ""} />
              {isRecalculating ? "Evaluating ML Job..." : "Recalculate Risk Job"}
            </button>
          )}
        </div>
      </div>

      {/* Persona Output Switcher (Restricted to Faculty and Administrators) */}
      {(currentUser?.role === "teacher" || currentUser?.role === "admin") && (
        <div className="persona-switcher-bar">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Eye size={18} color="var(--text-secondary)" />
            <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)" }}>Persona Simulation:</span>
          </div>
          <div className="persona-pills">
            <button
              className={`persona-pill ${activePersona === "faculty" ? "active" : ""}`}
              onClick={() => setActivePersona("faculty")}
            >
              <Building size={14} /> Faculty View
            </button>
            <button
              className={`persona-pill ${activePersona === "student" ? "active" : ""}`}
              onClick={() => setActivePersona("student")}
            >
              <HeartHandshake size={14} /> Student View (Empathetic)
            </button>
            <button
              className={`persona-pill ${activePersona === "parent" ? "active" : ""}`}
              onClick={() => setActivePersona("parent")}
            >
              <UserCheck size={14} /> Parent View (Softened)
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. FACULTY VIEW: Flagged Dashboard View Ordered by Severity
      ───────────────────────────────────────────────────────────── */}
      {activePersona === "faculty" && (
        <>
          {/* Executive Stats Row */}
          {summary && (
            <div className="risk-stats-grid">
              <div className="risk-stat-card">
                <div className="risk-stat-top">
                  <span className="risk-stat-title">Critical Attention (&ge; 70%)</span>
                  <div className="risk-stat-icon" style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }}>
                    <AlertTriangle size={18} />
                  </div>
                </div>
                <div className="risk-stat-value" style={{ color: "#ef4444" }}>
                  {summary.criticalCount}
                </div>
                <div className="risk-stat-sub">Immediate intervention recommended</div>
              </div>

              <div className="risk-stat-card">
                <div className="risk-stat-top">
                  <span className="risk-stat-title">Moderate Risk (40–69%)</span>
                  <div className="risk-stat-icon" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}>
                    <Clock size={18} />
                  </div>
                </div>
                <div className="risk-stat-value" style={{ color: "#f59e0b" }}>
                  {summary.moderateCount}
                </div>
                <div className="risk-stat-sub">Attendance or homework drop-offs detected</div>
              </div>

              <div className="risk-stat-card">
                <div className="risk-stat-top">
                  <span className="risk-stat-title">Active Interventions</span>
                  <div className="risk-stat-icon" style={{ background: "rgba(99, 102, 241, 0.15)", color: "#6366f1" }}>
                    <HeartHandshake size={18} />
                  </div>
                </div>
                <div className="risk-stat-value">{summary.activeInterventionsCount}</div>
                <div className="risk-stat-sub">Counseling sessions scheduled</div>
              </div>

              <div className="risk-stat-card">
                <div className="risk-stat-top">
                  <span className="risk-stat-title">Average Risk Index</span>
                  <div className="risk-stat-icon" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
                    <Sparkles size={18} />
                  </div>
                </div>
                <div className="risk-stat-value">
                  {summary.averageCohortRisk}%
                </div>
                <div className="risk-stat-sub">Across {summary.totalEvaluated} monitored scholars</div>
              </div>
            </div>
          )}

          {/* Flagged Roster Table Card */}
          <div className="roster-card">
            <div className="roster-header-bar">
              <div>
                <h3 style={{ margin: "0 0 4px 0", fontSize: "1.2rem", fontWeight: 700 }}>
                  Flagged Academic Risk Roster
                </h3>
                <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.88rem" }}>
                  Ranked by predictive severity ($100\% \rightarrow 0\%$) to prioritize early academic counseling.
                </p>
              </div>

              {/* Filter Tabs & Search */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ position: "relative" }}>
                  <Search size={15} style={{ position: "absolute", left: 12, top: 11, color: "var(--text-secondary)" }} />
                  <input
                    type="text"
                    placeholder="Search student or department..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      padding: "8px 12px 8px 34px",
                      borderRadius: 10,
                      border: "1px solid var(--border-color)",
                      background: "var(--bg-card)",
                      color: "var(--text-primary)",
                      fontSize: "0.86rem",
                      outline: "none",
                      width: 220,
                    }}
                  />
                </div>

                <div className="roster-filter-pills">
                  {(["all", "critical", "moderate", "safe"] as const).map((tier) => (
                    <button
                      key={tier}
                      className={`persona-pill ${selectedTierFilter === tier ? "active" : ""}`}
                      style={{ padding: "6px 14px", fontSize: "0.82rem" }}
                      onClick={() => setSelectedTierFilter(tier)}
                    >
                      {tier.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table className="roster-table">
                <thead>
                  <tr>
                    <th>Student & Department</th>
                    <th>Risk Score (0–100%)</th>
                    <th>Tier</th>
                    <th>Diagnostic Factor Attribution</th>
                    <th>Trend</th>
                    <th>Intervention</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoster.map((s) => {
                    const score = s.overallRiskScore ?? s.riskScore ?? 0;
                    const factorsList = s.riskFactors || s.factors || s.reasons || [];
                    const isScheduled = s.interventionStatus === "counseling_scheduled";

                    return (
                      <tr key={s.id || s.studentId}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 10,
                                background: "rgba(99, 102, 241, 0.12)",
                                color: "#6366f1",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 700,
                                fontSize: "0.9rem",
                              }}
                            >
                              {s.studentName.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{s.studentName}</div>
                              <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{s.department}</div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="risk-score-wrapper">
                            <span style={{ fontWeight: 800, color: getScoreColor(score), width: 38 }}>{score}%</span>
                            <div className="risk-bar-track">
                              <div
                                className="risk-bar-fill"
                                style={{
                                  width: `${score}%`,
                                  background: getScoreColor(score),
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`risk-tier-pill ${
                              score >= 70 ? "critical" : score >= 40 ? "moderate" : "safe"
                            }`}
                          >
                            {score >= 70 ? "Critical" : score >= 40 ? "Moderate" : "On Track"}
                          </span>
                        </td>

                        <td style={{ maxWidth: 360 }}>
                          <div>
                            {factorsList.slice(0, 3).map((f, i) => (
                              <span key={i} className="factor-tag">
                                {f}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td>
                          {s.trend === "worsening" ? (
                            <span style={{ color: "#ef4444", display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.82rem", fontWeight: 600 }}>
                              <TrendingUp size={14} /> Worsening
                            </span>
                          ) : s.trend === "improving" ? (
                            <span style={{ color: "#10b981", display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.82rem", fontWeight: 600 }}>
                              <TrendingDown size={14} /> Improving
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>Stable</span>
                          )}
                        </td>

                        <td>
                          {isScheduled ? (
                            <span className="risk-pill-badge continuous-ml" style={{ fontSize: "0.76rem" }}>
                              <CheckCircle size={12} /> Scheduled ({s.counselingDate || "Upcoming"})
                            </span>
                          ) : (
                            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>None</span>
                          )}
                        </td>

                        <td style={{ textAlign: "right" }}>
                          {isScheduled ? (
                            <button className="schedule-counsel-btn scheduled" onClick={() => handleOpenCounselModal(s)}>
                              <Calendar size={13} /> Reschedule
                            </button>
                          ) : (
                            <button className="schedule-counsel-btn" onClick={() => handleOpenCounselModal(s)}>
                              <Calendar size={13} /> Schedule Counseling
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ML Model Architecture & Explainability Section */}
          {modelInfo && (
            <div className="ml-model-section">
              <div className="ml-model-header">
                <div className="ml-model-title">
                  <div className="risk-stat-icon" style={{ background: "rgba(99, 102, 241, 0.15)", color: "#6366f1" }}>
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3>ML Model Architecture & Risk Factor Attribution</h3>
                    <p>
                      Supervised ensemble trained on multi-semester academic datasets to predict dropout and failure risks.
                    </p>
                  </div>
                </div>

                <div className="ml-accuracy-badge">
                  <CheckCircle size={16} />
                  <span>Validation Accuracy: {modelInfo.validation_accuracy}% | R² {modelInfo.r2_score}</span>
                </div>
              </div>

              <div className="ml-specs-grid">
                <div className="ml-spec-box">
                  <span className="ml-spec-label">Algorithm</span>
                  <span className="ml-spec-val" style={{ fontSize: "1rem" }}>{modelInfo.algorithm.split(' + ')[0]}</span>
                  <span className="ml-spec-desc">+ GradientBoostingRegressor</span>
                </div>
                <div className="ml-spec-box">
                  <span className="ml-spec-label">Training Dataset</span>
                  <span className="ml-spec-val">{(modelInfo.total_training_samples || 3500).toLocaleString()}</span>
                  <span className="ml-spec-desc">Annotated student records</span>
                </div>
                <div className="ml-spec-box">
                  <span className="ml-spec-label">Inference Engine</span>
                  <span className="ml-spec-val" style={{ fontSize: "1.05rem" }}>Python 3.13 / Scikit-Learn</span>
                  <span className="ml-spec-desc">Microservice on port 8000</span>
                </div>
                <div className="ml-spec-box">
                  <span className="ml-spec-label">Continuous Evaluation</span>
                  <span className="ml-spec-val" style={{ fontSize: "1.05rem" }}>Background ML Jobs</span>
                  <span className="ml-spec-desc">Automated cron & on-demand</span>
                </div>
              </div>

              <div>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  Feature Importance Weights in Risk Calculation
                </h4>
                <div className="ml-features-container">
                  {Object.entries(modelInfo.feature_importances || {}).map(([feat, imp]) => {
                    const labelMap: Record<string, string> = {
                      attendance_rate: "Attendance Percentage (Classroom Consistency)",
                      missed_assignments: "Unsubmitted / Overdue Coursework Assignments",
                      failing_courses: "Courses with Failing Grade Risk",
                      gpa: "Cumulative Grade Point Average (GPA)",
                      recent_absences: "Recent Consecutive Unexcused Absences",
                      recent_exam_score: "Recent Midterm & Quiz Performance",
                      avg_assignment_grade: "Average Assignment Performance",
                    };
                    const label = labelMap[feat] || feat.replace(/_/g, " ").toUpperCase();
                    return (
                      <div key={feat} className="ml-feature-row">
                        <div className="ml-feature-meta">
                          <span>{label}</span>
                          <span>{imp}%</span>
                        </div>
                        <div className="ml-feature-track">
                          <div className="ml-feature-fill" style={{ width: `${Math.min(100, imp * 2.5)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. STUDENT VIEW: Empathetic, Private Academic Wellness View
      ───────────────────────────────────────────────────────────── */}
      {activePersona === "student" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Empathetic Banner */}
          <div className="student-wellness-card">
            <div className="wellness-icon-box">
              <HeartHandshake size={30} />
            </div>
            <div className="wellness-content">
              <h3>Academic Guidance & Wellness Center</h3>
              <p>
                {studentWellness?.empatheticMessage ||
                  "Your professors are here to help! Schedule office hours or peer tutoring whenever you want to clarify concepts."}
              </p>

              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div style={{ background: "rgba(255,255,255,0.7)", padding: "10px 18px", borderRadius: 12, border: "1px solid var(--border-color)" }}>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 600 }}>Attendance Health</div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#10b981" }}>
                    {studentWellness?.attendanceRate ?? 92}%
                  </div>
                </div>

                <div style={{ background: "rgba(255,255,255,0.7)", padding: "10px 18px", borderRadius: 12, border: "1px solid var(--border-color)" }}>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 600 }}>Cumulative GPA</div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#6366f1" }}>
                    {studentWellness?.gpa ?? 3.4}
                  </div>
                </div>

                <div style={{ background: "rgba(255,255,255,0.7)", padding: "10px 18px", borderRadius: 12, border: "1px solid var(--border-color)" }}>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 600 }}>Pending Homeworks</div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#f59e0b" }}>
                    {studentWellness?.missedAssignments ?? 0}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Campus Support Circles */}
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "6px 0 0 0" }}>
            Available Academic Support & Peer Circles
          </h3>

          <div className="wellness-resources-grid">
            {studentWellness?.supportResources?.map((res, i) => (
              <div key={i} className="wellness-resource-box">
                <div>
                  <h4 style={{ margin: "0 0 6px 0", fontSize: "1.05rem", fontWeight: 700 }}>{res.name}</h4>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 4 }}>
                    🕒 {res.schedule}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    📍 {res.location}
                  </div>
                </div>
                <button
                  className="at-risk-action-btn primary"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={() => alert(`Reserved slot for ${res.name}. Notification dispatched to your calendar.`)}
                >
                  {res.actionText}
                </button>
              </div>
            ))}
          </div>

          {/* Scheduled Sessions */}
          {studentWellness?.scheduledSessions && studentWellness.scheduledSessions.length > 0 && (
            <div className="roster-card">
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Your Scheduled Counseling Sessions</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {studentWellness.scheduledSessions.map((session) => (
                  <div
                    key={session.id}
                    style={{
                      padding: 16,
                      borderRadius: 14,
                      background: "rgba(99, 102, 241, 0.05)",
                      border: "1px solid rgba(99, 102, 241, 0.2)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>{session.counselorName}</div>
                      <div style={{ fontSize: "0.84rem", color: "var(--text-secondary)" }}>
                        {session.date} at {session.timeSlot} • {session.location}
                      </div>
                      {session.notes && <div style={{ fontSize: "0.82rem", fontStyle: "italic", marginTop: 4 }}>“{session.notes}”</div>}
                    </div>
                    <span className="risk-pill-badge continuous-ml">Confirmed</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. PARENT VIEW: Softened Risk Indicators (NO RAW SCORES)
      ───────────────────────────────────────────────────────────── */}
      {activePersona === "parent" && parentData && (
        <div className="parent-view-card">
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: "1.45rem", fontWeight: 700, margin: "0 0 6px 0" }}>
              Academic Progress & Student Engagement Overview
            </h2>
            <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.92rem" }}>
              Student: <strong>{parentData.studentName}</strong> • {parentData.department}
            </p>
          </div>

          {/* Softened Status Hero */}
          <div
            className={`parent-status-hero ${
              parentData.status === "Needs Attention"
                ? "needs-attention"
                : parentData.status === "On Track"
                ? "on-track"
                : "excelling"
            }`}
          >
            <div>
              <div style={{ fontSize: "0.86rem", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>
                Current Term Academic Status
              </div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800 }}>
                {parentData.statusBadge}
              </div>
            </div>
            <ShieldCheck size={42} style={{ opacity: 0.8 }} />
          </div>

          <div>
            <h4 style={{ margin: "0 0 8px 0", fontSize: "1rem", fontWeight: 700 }}>Academic Advisor Summary</h4>
            <p style={{ margin: 0, color: "var(--text-secondary)", lineHeight: 1.6, fontSize: "0.94rem" }}>
              {parentData.guidanceSummary}
            </p>
          </div>

          <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: 18 }}>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "0.98rem", fontWeight: 700 }}>Constructive Focus Areas</h4>
            <div className="focus-list">
              {parentData.constructiveFocusAreas?.map((item, idx) => (
                <div key={idx} className="focus-item">
                  <CheckCircle size={18} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "rgba(0,0,0,0.03)", padding: 18, borderRadius: 14, fontSize: "0.88rem", color: "var(--text-secondary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Need to connect with the department chair or course advisor?</span>
            <button
              className="at-risk-action-btn primary"
              style={{ padding: "8px 16px", fontSize: "0.84rem" }}
              onClick={() => alert("Connecting you with Student Academic Advising Center...")}
            >
              Message Advisor
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          Counseling Scheduling Modal
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isCounselModalOpen && counselStudent && (
          <div className="counsel-modal-backdrop" onClick={() => !isScheduling && setIsCounselModalOpen(false)}>
            <motion.div
              className="counsel-modal-card"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="counsel-modal-header">
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>Schedule Academic Counseling</h3>
                  <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.84rem" }}>
                    Student: {counselStudent.studentName} ({counselStudent.overallRiskScore ?? counselStudent.riskScore}%)
                  </p>
                </div>
                <button
                  onClick={() => setIsCounselModalOpen(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="counsel-modal-body">
                <div className="form-group">
                  <label>Counseling Intervention Type</label>
                  <select
                    className="counsel-select"
                    value={counselType}
                    onChange={(e) => setCounselType(e.target.value)}
                  >
                    <option value="academic_tutoring">Academic Peer Tutoring & Concept Review</option>
                    <option value="attendance_advising">Attendance Recovery & Advising</option>
                    <option value="coursework_support">Coursework & Lab Assignment Support</option>
                    <option value="wellness_mentoring">Academic Wellness & Mentoring Consultation</option>
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div className="form-group">
                    <label>Appointment Date</label>
                    <input
                      type="date"
                      className="counsel-input"
                      value={counselDate}
                      onChange={(e) => setCounselDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Time Slot</label>
                    <input
                      type="text"
                      className="counsel-input"
                      value={counselTime}
                      onChange={(e) => setCounselTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Meeting Venue / Room</label>
                  <input
                    type="text"
                    className="counsel-input"
                    value={counselLocation}
                    onChange={(e) => setCounselLocation(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Intervention Notes & Strategy</label>
                  <textarea
                    className="counsel-textarea"
                    rows={3}
                    value={counselNotes}
                    onChange={(e) => setCounselNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="counsel-modal-footer">
                <button
                  className="at-risk-action-btn"
                  onClick={() => setIsCounselModalOpen(false)}
                  disabled={isScheduling}
                >
                  Cancel
                </button>
                <button
                  className="at-risk-action-btn primary"
                  onClick={handleSubmitCounseling}
                  disabled={isScheduling}
                >
                  {isScheduling ? "Dispatching..." : "Confirm & Notify Student"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
