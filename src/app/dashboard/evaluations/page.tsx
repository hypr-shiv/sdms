"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  ShieldCheck,
  CheckCircle,
  Clock,
  Download,
  Filter,
  BarChart3,
  MessageSquare,
  Sparkles,
  Layers,
  HelpCircle,
  Check,
  X,
  Send,
  AlertCircle,
  Award,
  ChevronRight,
  Settings,
  BookOpen,
  Building,
} from "lucide-react";
import "./evaluations.css";

interface EvaluationQuestion {
  id: string;
  category: string;
  type: "rating" | "text" | "choice";
  questionText: string;
  required: boolean;
  minRating?: number;
  maxRating?: number;
  options?: string[];
}

interface EvaluationForm {
  id: string;
  title: string;
  description: string;
  semester: string;
  academicYear: string;
  ratingScaleMin: number;
  ratingScaleMax: number;
  ratingScaleLabels: string[];
  questions: EvaluationQuestion[];
  endDate?: string;
}

interface StudentCourseItem {
  courseId: string;
  courseCode: string;
  courseName: string;
  instructor: string;
  departmentName: string;
  credits: number;
  semester: string;
  hasSubmitted: boolean;
  submittedAt: string | null;
}

interface QuestionStat {
  questionId: string;
  questionText: string;
  category: string;
  averageScore: number;
  stdDev: number;
  responseCount: number;
  distribution: Record<number, number>;
  distributionPercent: Record<number, number>;
}

interface CourseRanking {
  courseId: string;
  courseCode: string;
  courseName: string;
  instructorName: string;
  departmentCode: string;
  responseCount: number;
  averageScore: number;
}

interface QualitativeComment {
  id: string;
  courseCode: string;
  courseName: string;
  instructorName: string;
  category: string;
  questionId: string;
  answer: string;
  sentiment: "positive" | "constructive" | "neutral";
  submittedAt: string;
}

interface AggregateAnalytics {
  accessInfo: {
    isGlobalAdmin: boolean;
    isDepartmentHead: boolean;
    scopedDepartment: string;
    departmentName?: string;
  };
  summary: {
    totalEvaluations: number;
    overallAverageScore: number;
    responseRate: number;
    totalEligibleEnrollments: number;
    totalCoursesEvaluated: number;
  };
  categoryBreakdown: Array<{
    category: string;
    averageScore: number;
    responseCount: number;
  }>;
  questionBreakdown: QuestionStat[];
  courseRankings: CourseRanking[];
  sentimentSummary: {
    totalComments: number;
    positiveCount: number;
    constructiveCount: number;
    neutralCount: number;
    positivePercentage: number;
    constructivePercentage: number;
    neutralPercentage: number;
  };
  qualitativeComments: QualitativeComment[];
  departments: Array<{ code: string; name: string }>;
}

export default function EvaluationsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Access Scope State
  const [access, setAccess] = useState<{
    canAccess: boolean;
    isGlobalAdmin: boolean;
    isDepartmentHead: boolean;
    departmentCode?: string;
    departmentName?: string;
    reason?: string;
  } | null>(null);

  // Student State
  const [studentCourses, setStudentCourses] = useState<StudentCourseItem[]>([]);
  const [activeForm, setActiveForm] = useState<EvaluationForm | null>(null);
  const [selectedCourseForEval, setSelectedCourseForEval] = useState<StudentCourseItem | null>(null);
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [ratingAnswers, setRatingAnswers] = useState<Record<string, number>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [hoveredStars, setHoveredStars] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccessMsg, setSubmissionSuccessMsg] = useState<string | null>(null);

  // Admin & Department Head Analytics State
  const [analytics, setAnalytics] = useState<AggregateAnalytics | null>(null);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("all");
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState("FA26");
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState<
    "overview" | "questions" | "qualitative" | "config"
  >("overview");
  const [sentimentFilter, setSentimentFilter] = useState<"all" | "positive" | "constructive" | "neutral">("all");
  const [isExporting, setIsExporting] = useState(false);

  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessToken");
    }
    return null;
  };

  // 1. Initial Load & Access Verification
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        setCurrentUser(JSON.parse(stored));
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
      // Check user access scope
      const accessRes = await fetch("http://localhost:3001/evaluation/access", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const accessData = await accessRes.json();
      setAccess(accessData);

      // If Student, load pending courses and active form
      if (currentUser?.role === "student" || (!accessData.canAccess && accessData.reason?.includes("student"))) {
        const studentRes = await fetch("http://localhost:3001/evaluation/student/status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (studentRes.ok) {
          const studentData = await studentRes.json();
          setStudentCourses(studentData.courses || []);
          setActiveForm(studentData.form || null);
        }
      }

      // If Admin or Department Head, load aggregate analytics
      if (accessData.canAccess) {
        const deptParam = accessData.isDepartmentHead ? accessData.departmentCode : selectedDeptFilter;
        const analyticsRes = await fetch(
          `http://localhost:3001/evaluation/analytics/overview?semester=${selectedSemesterFilter}&departmentCode=${deptParam}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json();
          setAnalytics(analyticsData);
        }
      }
    } catch (err) {
      console.error("Error loading evaluation data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, selectedDeptFilter, selectedSemesterFilter]);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser, loadData]);

  // Handle student starting evaluation
  const handleOpenEvaluation = (course: StudentCourseItem) => {
    setSelectedCourseForEval(course);
    setRatingAnswers({});
    setTextAnswers({});
    setHoveredStars({});
    setSubmissionSuccessMsg(null);
    setIsEvalModalOpen(true);
  };

  // Submit student evaluation
  const handleSubmitEvaluation = async () => {
    if (!activeForm || !selectedCourseForEval) return;
    const token = getAuthToken();
    if (!token) return;

    // Check required questions
    const missingRequired = (activeForm.questions || [])
      .filter((q) => q.required && q.type === "rating")
      .some((q) => !ratingAnswers[q.id]);

    if (missingRequired) {
      alert("Please provide a rating for all required questions before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payloadRatings = Object.entries(ratingAnswers).map(([qid, val]) => {
        const qObj = activeForm.questions.find((q) => q.id === qid);
        return {
          questionId: qid,
          rating: val,
          category: qObj?.category || "General",
        };
      });

      const payloadTexts = Object.entries(textAnswers).map(([qid, textVal]) => {
        const qObj = activeForm.questions.find((q) => q.id === qid);
        return {
          questionId: qid,
          answer: textVal,
          category: qObj?.category || "Qualitative Feedback",
        };
      });

      const res = await fetch("http://localhost:3001/evaluation/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          formId: activeForm.id,
          courseId: selectedCourseForEval.courseId,
          ratings: payloadRatings,
          textAnswers: payloadTexts,
        }),
      });

      const resData = await res.json();
      if (res.ok) {
        setSubmissionSuccessMsg(resData.message);
        // Refresh student course list
        setTimeout(() => {
          setIsEvalModalOpen(false);
          loadData();
        }, 2200);
      } else {
        alert(resData.message || "Failed to submit evaluation.");
      }
    } catch (e) {
      console.error(e);
      alert("Network error while submitting evaluation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export CSV Dossier
  const handleExportCsv = async () => {
    const token = getAuthToken();
    if (!token) return;
    setIsExporting(true);
    try {
      const res = await fetch(
        `http://localhost:3001/evaluation/analytics/export?semester=${selectedSemesterFilter}&departmentCode=${selectedDeptFilter}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Academic_Course_Evaluations_${selectedSemesterFilter}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const getRatingLabel = (score: number) => {
    if (!activeForm?.ratingScaleLabels) return "";
    return activeForm.ratingScaleLabels[score - 1] || "";
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER: Loading Spinner
  // ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="evaluations-container" style={{ alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ width: 44, height: 44, border: "3px solid rgba(99,102,241,0.15)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginTop: 16 }}>Loading course evaluation platform...</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: Individual Faculty Policy Shield (Not Dept Head & Not Admin)
  // ─────────────────────────────────────────────────────────────
  if (currentUser?.role === "teacher" && access && !access.canAccess) {
    return (
      <div className="evaluations-container">
        <div className="faculty-policy-card">
          <div className="faculty-shield-icon">
            <ShieldCheck size={36} />
          </div>
          <h2>Academic Governance & Evaluation Privacy</h2>
          <p>
            In compliance with institutional academic senate policy, student course evaluation records and aggregate satisfaction metrics are strictly restricted to <strong>Department Chairs</strong> and <strong>Institutional Administrators</strong>.
          </p>
          <div style={{ background: "rgba(99,102,241,0.06)", borderRadius: 14, padding: "16px 20px", fontSize: "0.9rem", color: "var(--text-secondary)", textAlign: "left", lineHeight: 1.5 }}>
            💡 <strong>Why are evaluations restricted?</strong>
            <ul style={{ margin: "8px 0 0 16px", padding: 0 }}>
              <li>Protects student confidentiality and candid constructive feedback.</li>
              <li>Prevents biased self-reporting and protects faculty autonomy in grading rigor.</li>
              <li>Department Chairs conduct formative teaching reviews in designated academic consultations.</li>
            </ul>
          </div>
          <p style={{ fontSize: "0.88rem" }}>
            If you are a Department Head or Academic Chair requiring administrative access, please contact the University Provost Office.
          </p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: Student Anonymous Evaluation Portal
  // ─────────────────────────────────────────────────────────────
  if (currentUser?.role === "student") {
    const completedCourses = studentCourses.filter((c) => c.hasSubmitted);
    const pendingCourses = studentCourses.filter((c) => !c.hasSubmitted);

    return (
      <div className="evaluations-container">
        {/* Hero Card */}
        <div className="eval-hero-card">
          <div className="eval-hero-left">
            <h1>
              <Star size={26} color="#f59e0b" fill="#f59e0b" />
              Course & Teaching Evaluations
            </h1>
            <p>Share constructive, anonymous feedback to shape curriculum excellence and teaching quality.</p>
            <div className="eval-hero-badges">
              <span className="eval-pill-badge active-term">
                <Clock size={13} /> Active Term: {activeForm?.semester || "FA26"}
              </span>
              <span className="eval-pill-badge anonymous-shield">
                <ShieldCheck size={13} /> 100% Cryptographically Anonymous
              </span>
            </div>
          </div>
          <div className="eval-hero-actions">
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-primary)" }}>
                {completedCourses.length} / {studentCourses.length}
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>Evaluations Completed</div>
            </div>
          </div>
        </div>

        {/* Anonymity Guarantee Banner */}
        <div className="anonymity-banner">
          <div className="anonymity-icon-box">
            <ShieldCheck size={24} />
          </div>
          <div className="anonymity-content">
            <h4>Strict Identity Decoupling Guarantee</h4>
            <p>
              Your evaluation responses are permanently dissociated from your student account. A one-way ledger tracks submission completion to unlock academic records, but no administrator, dean, or course instructor can link your ratings or written feedback back to your identity.
            </p>
          </div>
        </div>

        {/* Course Cards Grid */}
        <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "10px 0 0 0", color: "var(--text-primary)" }}>
          Your Enrolled Courses ({studentCourses.length})
        </h2>

        {studentCourses.length === 0 ? (
          <div style={{ background: "var(--bg-card)", padding: 48, borderRadius: 18, textAlign: "center", border: "1px dashed var(--border-color)" }}>
            <BookOpen size={40} style={{ color: "var(--text-secondary)", marginBottom: 12 }} />
            <h3>No Course Evaluations Required</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem" }}>
              You do not have any pending end-of-semester course evaluations for the current active academic period.
            </p>
          </div>
        ) : (
          <div className="student-eval-grid">
            {studentCourses.map((c) => (
              <motion.div
                key={c.courseId}
                className={`student-eval-card ${c.hasSubmitted ? "completed" : ""}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div>
                  <div className="eval-card-header">
                    <span className="course-code-badge">{c.courseCode}</span>
                    <span className={`status-badge ${c.hasSubmitted ? "done" : "pending"}`}>
                      {c.hasSubmitted ? (
                        <>
                          <CheckCircle size={13} /> Completed
                        </>
                      ) : (
                        <>
                          <Clock size={13} /> Pending Submission
                        </>
                      )}
                    </span>
                  </div>

                  <div className="course-info">
                    <h3>{c.courseName}</h3>
                    <div className="course-meta-row">
                      <span>👨‍🏫 Instructor: <strong>{c.instructor}</strong></span>
                      <span>🏛️ Department: {c.departmentName}</span>
                      <span>🎓 Credits: {c.credits} Units</span>
                    </div>
                  </div>
                </div>

                <div>
                  {c.hasSubmitted ? (
                    <button className="eval-action-btn view-submitted" disabled>
                      <CheckCircle size={16} /> Evaluation Submitted Anonymously
                    </button>
                  ) : (
                    <button className="eval-action-btn start" onClick={() => handleOpenEvaluation(c)}>
                      <Star size={16} /> Complete Anonymous Evaluation <ChevronRight size={16} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Evaluation Modal */}
        <AnimatePresence>
          {isEvalModalOpen && selectedCourseForEval && activeForm && (
            <div className="eval-modal-backdrop" onClick={() => !isSubmitting && setIsEvalModalOpen(false)}>
              <motion.div
                className="eval-modal-content"
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
              >
                {/* Modal Header */}
                <div className="eval-modal-header">
                  <div>
                    <h2>
                      {selectedCourseForEval.courseCode}: {selectedCourseForEval.courseName}
                    </h2>
                    <p>
                      Instructor: {selectedCourseForEval.instructor} • Anonymous Feedback Questionnaire
                    </p>
                  </div>
                  <button className="eval-modal-close-btn" onClick={() => setIsEvalModalOpen(false)}>
                    <X size={20} />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="eval-modal-body">
                  {submissionSuccessMsg ? (
                    <div style={{ textAlign: "center", padding: "40px 20px" }}>
                      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(16,185,129,0.15)", color: "#10b981", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                        <CheckCircle size={36} />
                      </div>
                      <h3 style={{ fontSize: "1.3rem", fontWeight: 700, margin: "0 0 8px 0" }}>Evaluation Submitted!</h3>
                      <p style={{ color: "var(--text-secondary)", maxWidth: 440, margin: "0 auto", lineHeight: 1.5 }}>
                        {submissionSuccessMsg}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div style={{ background: "rgba(99,102,241,0.06)", padding: "14px 18px", borderRadius: 12, fontSize: "0.88rem", color: "var(--text-secondary)", display: "flex", gap: 10 }}>
                        <ShieldCheck size={18} color="#6366f1" style={{ flexShrink: 0 }} />
                        <span>
                          Responses are completely anonymous. Please answer honestly according to your classroom learning experience.
                        </span>
                      </div>

                      {activeForm.questions.map((q, idx) => (
                        <div key={q.id} className="question-item-card">
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span className="question-cat-tag">{q.category}</span>
                            {q.required && <span style={{ fontSize: "0.76rem", color: "#ef4444", fontWeight: 600 }}>* Required</span>}
                          </div>

                          <p className="question-text-title">
                            {idx + 1}. {q.questionText}
                          </p>

                          {q.type === "rating" ? (
                            <div className="rating-stars-row">
                              {[1, 2, 3, 4, 5].map((starNum) => {
                                const currentRating = ratingAnswers[q.id] || 0;
                                const hovered = hoveredStars[q.id] || 0;
                                const isFilled = starNum <= (hovered || currentRating);

                                return (
                                  <button
                                    key={starNum}
                                    type="button"
                                    className={`star-btn ${isFilled ? "active" : ""}`}
                                    onMouseEnter={() => setHoveredStars((prev) => ({ ...prev, [q.id]: starNum }))}
                                    onMouseLeave={() => setHoveredStars((prev) => ({ ...prev, [q.id]: 0 }))}
                                    onClick={() => setRatingAnswers((prev) => ({ ...prev, [q.id]: starNum }))}
                                  >
                                    <Star size={26} fill={isFilled ? "#f59e0b" : "none"} />
                                  </button>
                                );
                              })}

                              <span className="rating-scale-feedback">
                                {ratingAnswers[q.id]
                                  ? getRatingLabel(ratingAnswers[q.id])
                                  : "Click star to rate"}
                              </span>
                            </div>
                          ) : (
                            <textarea
                              className="eval-textarea"
                              placeholder="Type your constructive comments and observations here..."
                              value={textAnswers[q.id] || ""}
                              onChange={(e) => setTextAnswers({ ...textAnswers, [q.id]: e.target.value })}
                            />
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </div>

                {/* Modal Footer */}
                {!submissionSuccessMsg && (
                  <div className="eval-modal-footer">
                    <button className="eval-modal-close-btn" onClick={() => setIsEvalModalOpen(false)}>
                      Cancel
                    </button>
                    <button
                      className="eval-action-btn start"
                      style={{ width: "auto", padding: "10px 24px" }}
                      onClick={handleSubmitEvaluation}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>Submitting...</>
                      ) : (
                        <>
                          <Send size={15} /> Submit Anonymous Evaluation
                        </>
                      )}
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: Admin & Department Head Aggregate Analytics Dashboard
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="evaluations-container">
      {/* Hero Header */}
      <div className="eval-hero-card">
        <div className="eval-hero-left">
          <h1>
            <BarChart3 size={28} color="#6366f1" />
            Course Evaluations & Academic Quality Analytics
          </h1>
          <p>
            {access?.isGlobalAdmin
              ? "Institutional-wide aggregate student feedback and curriculum satisfaction dossier."
              : `Department of ${access?.departmentName || access?.departmentCode}: End-of-semester faculty & course metrics.`}
          </p>
          <div className="eval-hero-badges">
            <span className="eval-pill-badge active-term">
              <Building size={13} /> Scope: {access?.isGlobalAdmin ? "All University Departments" : access?.departmentName}
            </span>
            <span className="eval-pill-badge anonymous-shield">
              <ShieldCheck size={13} /> Strict Anonymity Enforced
            </span>
          </div>
        </div>

        <div className="eval-hero-actions">
          {/* Department Filter for Global Admin */}
          {access?.isGlobalAdmin && (
            <select
              style={{
                padding: "9px 14px",
                borderRadius: 12,
                border: "1px solid var(--border-color)",
                background: "var(--bg-card)",
                color: "var(--text-primary)",
                fontSize: "0.88rem",
                outline: "none",
                cursor: "pointer",
              }}
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
            >
              <option value="all">All Departments</option>
              {analytics?.departments?.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          )}

          {/* Export CSV Dossier Button */}
          <button className="eval-export-btn" onClick={handleExportCsv} disabled={isExporting}>
            <Download size={15} /> {isExporting ? "Exporting..." : "Export Dossier (.CSV)"}
          </button>
        </div>
      </div>

      {/* Executive KPI Stats */}
      {analytics && (
        <div className="eval-stats-grid">
          <div className="eval-stat-card">
            <div className="eval-stat-top">
              <span className="eval-stat-title">Overall Mean Score</span>
              <div className="eval-stat-icon" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}>
                <Star size={18} fill="#f59e0b" />
              </div>
            </div>
            <div className="eval-stat-value">
              {analytics.summary.overallAverageScore} <span style={{ fontSize: "1.1rem", color: "var(--text-secondary)" }}>/ 5.0</span>
            </div>
            <div className="eval-stat-sub">Across {analytics.summary.totalCoursesEvaluated} evaluated courses</div>
          </div>

          <div className="eval-stat-card">
            <div className="eval-stat-top">
              <span className="eval-stat-title">Total Submissions</span>
              <div className="eval-stat-icon" style={{ background: "rgba(99, 102, 241, 0.15)", color: "#6366f1" }}>
                <Layers size={18} />
              </div>
            </div>
            <div className="eval-stat-value">{analytics.summary.totalEvaluations}</div>
            <div className="eval-stat-sub">Decoupled anonymous student records</div>
          </div>

          <div className="eval-stat-card">
            <div className="eval-stat-top">
              <span className="eval-stat-title">Response Rate</span>
              <div className="eval-stat-icon" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
                <CheckCircle size={18} />
              </div>
            </div>
            <div className="eval-stat-value">{analytics.summary.responseRate}%</div>
            <div className="eval-stat-sub">High statistical significance sample</div>
          </div>

          <div className="eval-stat-card">
            <div className="eval-stat-top">
              <span className="eval-stat-title">Positive Sentiment</span>
              <div className="eval-stat-icon" style={{ background: "rgba(6, 182, 212, 0.15)", color: "#06b6d4" }}>
                <Sparkles size={18} />
              </div>
            </div>
            <div className="eval-stat-value">{analytics.sentimentSummary.positivePercentage}%</div>
            <div className="eval-stat-sub">{analytics.sentimentSummary.totalComments} student quotes analyzed</div>
          </div>
        </div>
      )}

      {/* Tabs Navigation Bar */}
      <div className="eval-tabs-bar">
        <button
          className={`eval-tab-pill ${activeAnalyticsTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveAnalyticsTab("overview")}
        >
          <BarChart3 size={16} /> Overview & Course Rankings
        </button>
        <button
          className={`eval-tab-pill ${activeAnalyticsTab === "questions" ? "active" : ""}`}
          onClick={() => setActiveAnalyticsTab("questions")}
        >
          <Star size={16} /> Question-by-Question Distributions
        </button>
        <button
          className={`eval-tab-pill ${activeAnalyticsTab === "qualitative" ? "active" : ""}`}
          onClick={() => setActiveAnalyticsTab("qualitative")}
        >
          <MessageSquare size={16} /> Qualitative Comments & Sentiment
        </button>
        {access?.isGlobalAdmin && (
          <button
            className={`eval-tab-pill ${activeAnalyticsTab === "config" ? "active" : ""}`}
            onClick={() => setActiveAnalyticsTab("config")}
          >
            <Settings size={16} /> Questionnaire Configuration
          </button>
        )}
      </div>

      {/* TAB 1: Overview & Rankings */}
      {activeAnalyticsTab === "overview" && analytics && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Category Performance Breakdown */}
          <div className="q-analytics-card">
            <h3 style={{ margin: "0 0 14px 0", fontSize: "1.1rem", fontWeight: 700 }}>
              Category Satisfaction Indices
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {analytics.categoryBreakdown.map((cat) => (
                <div key={cat.category}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: "0.9rem", fontWeight: 600 }}>
                    <span>{cat.category}</span>
                    <span style={{ color: "#f59e0b" }}>{cat.averageScore} / 5.0</span>
                  </div>
                  <div className="star-bar-track">
                    <div
                      className="star-bar-fill"
                      style={{ width: `${(cat.averageScore / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Course Rankings Table */}
          <div className="q-analytics-card">
            <h3 style={{ margin: "0 0 14px 0", fontSize: "1.1rem", fontWeight: 700 }}>
              Course Performance Leaderboard
            </h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-color)", textAlign: "left", color: "var(--text-secondary)" }}>
                    <th style={{ padding: "8px 10px" }}>Course</th>
                    <th style={{ padding: "8px 10px" }}>Faculty</th>
                    <th style={{ padding: "8px 10px", textAlign: "center" }}>Responses</th>
                    <th style={{ padding: "8px 10px", textAlign: "right" }}>Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.courseRankings && analytics.courseRankings.length > 0 ? (
                    analytics.courseRankings.map((c) => (
                      <tr key={c.courseCode} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                        <td style={{ padding: "10px", fontWeight: 700, color: "var(--text-primary)" }}>
                          <span className="course-code-badge" style={{ marginRight: 6 }}>{c.courseCode}</span>
                          {c.courseName}
                        </td>
                        <td style={{ padding: "10px", color: "var(--text-secondary)" }}>{c.instructorName}</td>
                        <td style={{ padding: "10px", textAlign: "center" }}>{c.responseCount}</td>
                        <td style={{ padding: "10px", textAlign: "right", fontWeight: 800, color: "#f59e0b" }}>
                          ★ {c.averageScore}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} style={{ padding: "32px", textAlign: "center", color: "var(--text-secondary)" }}>
                        No course submissions recorded yet. Clean database state.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Question Distributions */}
      {activeAnalyticsTab === "questions" && analytics && (
        <div className="questions-analytics-grid">
          {analytics.questionBreakdown.map((q, idx) => (
            <div key={q.questionId} className="q-analytics-card">
              <div className="q-card-header">
                <div>
                  <span className="question-cat-tag" style={{ marginBottom: 6 }}>{q.category}</span>
                  <h4 style={{ margin: "4px 0", fontSize: "1.05rem", fontWeight: 700 }}>
                    {idx + 1}. {q.questionText}
                  </h4>
                  <div style={{ fontSize: "0.84rem", color: "var(--text-secondary)" }}>
                    Standard Deviation: σ = {q.stdDev} • Total Responses: {q.responseCount}
                  </div>
                </div>
                <div className="q-score-badge">
                  <div className="q-score-big">★ {q.averageScore}</div>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Mean Score</span>
                </div>
              </div>

              {/* Star Distribution Histogram */}
              <div className="star-bars-container">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const pct = q.distributionPercent[stars] || 0;
                  const count = q.distribution[stars] || 0;

                  return (
                    <div key={stars} className="star-bar-row">
                      <span className="star-bar-label">{stars} Stars</span>
                      <div className="star-bar-track">
                        <div className="star-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="star-bar-pct">{pct}% ({count})</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: Qualitative Comments & Sentiment */}
      {activeAnalyticsTab === "qualitative" && analytics && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Sentiment KPI Summary Banner */}
          <div className="sentiment-summary-banner">
            <div className="sentiment-stat-box pos">
              <Sparkles size={24} />
              <div>
                <div style={{ fontSize: "1.3rem", fontWeight: 800 }}>
                  {analytics.sentimentSummary.positiveCount} ({analytics.sentimentSummary.positivePercentage}%)
                </div>
                <div style={{ fontSize: "0.82rem" }}>Positive Affirmations</div>
              </div>
            </div>

            <div className="sentiment-stat-box con">
              <AlertCircle size={24} />
              <div>
                <div style={{ fontSize: "1.3rem", fontWeight: 800 }}>
                  {analytics.sentimentSummary.constructiveCount} ({analytics.sentimentSummary.constructivePercentage}%)
                </div>
                <div style={{ fontSize: "0.82rem" }}>Constructive Improvement Ideas</div>
              </div>
            </div>

            <div className="sentiment-stat-box neu">
              <MessageSquare size={24} />
              <div>
                <div style={{ fontSize: "1.3rem", fontWeight: 800 }}>
                  {analytics.sentimentSummary.neutralCount} ({analytics.sentimentSummary.neutralPercentage}%)
                </div>
                <div style={{ fontSize: "0.82rem" }}>General Observations</div>
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: "0.86rem", fontWeight: 600, color: "var(--text-secondary)" }}>Filter Sentiment:</span>
            {(["all", "positive", "constructive", "neutral"] as const).map((s) => (
              <button
                key={s}
                className={`eval-tab-pill ${sentimentFilter === s ? "active" : ""}`}
                style={{ padding: "6px 14px", fontSize: "0.84rem" }}
                onClick={() => setSentimentFilter(s)}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Comments Feed List */}
          <div className="comments-feed-list">
            {analytics.qualitativeComments && analytics.qualitativeComments.length > 0 ? (
              analytics.qualitativeComments
                .filter((c) => sentimentFilter === "all" || c.sentiment === sentimentFilter)
                .map((c) => (
                  <div key={c.id} className="comment-feed-card">
                    <div className="comment-card-top">
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="course-code-badge">{c.courseCode}</span>
                        <span style={{ fontSize: "0.88rem", fontWeight: 600 }}>{c.courseName}</span>
                        <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>• Faculty: {c.instructorName}</span>
                      </div>
                      <span className={`sentiment-pill ${c.sentiment}`}>{c.sentiment}</span>
                    </div>
                    <div className="comment-card-body">“{c.answer}”</div>
                  </div>
                ))
            ) : (
              <div style={{ padding: "48px 24px", textAlign: "center", background: "var(--bg-card)", borderRadius: 14, border: "1px solid var(--border-glass)" }}>
                <MessageSquare size={36} style={{ color: "var(--text-secondary)", opacity: 0.5, marginBottom: 12, display: "inline-block" }} />
                <h4 style={{ margin: "0 0 6px 0", fontSize: "1.05rem", fontWeight: 700 }}>No Qualitative Reviews Recorded</h4>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-secondary)", maxWidth: 440, marginInline: "auto" }}>
                  Zero synthetic reviews exist. Authentic qualitative feedback will appear here as students complete their course evaluations.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Questionnaire Configuration (Admin Only) */}
      {activeAnalyticsTab === "config" && access?.isGlobalAdmin && (
        <div className="q-analytics-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: "0 0 4px 0", fontSize: "1.2rem", fontWeight: 700 }}>
                Questionnaire & Rating Scale Engine
              </h3>
              <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                Customize institutional Likert scales, evaluation questions, and required field validation.
              </p>
            </div>
            <span className="status-badge done">
              <CheckCircle size={14} /> Active Questionnaire Template
            </span>
          </div>

          <div style={{ background: "rgba(0,0,0,0.02)", padding: 20, borderRadius: 14, marginTop: 14 }}>
            <h4 style={{ margin: "0 0 10px 0", fontSize: "0.95rem" }}>Configured Rating Scale (1 to 5)</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {[
                "1 - Unsatisfactory",
                "2 - Needs Improvement",
                "3 - Proficient / Meets Expectations",
                "4 - Very Good / Commendable",
                "5 - Exemplary / Outstanding",
              ].map((label, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 10,
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-color)",
                    fontSize: "0.86rem",
                    fontWeight: 600,
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
