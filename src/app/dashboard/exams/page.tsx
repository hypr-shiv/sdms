"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { type Role } from "@/lib/mockData";
import {
  ClipboardList, Clock, MapPin, Calendar, Plus, ChevronRight,
  Award, X, CheckCircle2, Play, Sparkles, Database, Layers,
  Check, AlertTriangle, Printer, Eye, EyeOff, Search, Filter,
  BookOpen, UserCheck, ShieldAlert, Cpu, RefreshCw, FileText,
  HelpCircle, Trash2, ListChecks, Hash, PenTool, Calculator,
  Flag, ChevronLeft, Maximize2, Minimize2, AlertOctagon, CheckSquare,
  Send, User, ArrowLeft, ShieldCheck
} from "lucide-react";
import "../dashboard.css";
import "./exams.css";

const TYPE_COLORS: Record<string, string> = {
  midterm: "#6366f1",
  final: "#ef4444",
  quiz: "#f59e0b",
  practical: "#06b6d4",
  assignment: "#10b981",
};

const STATUS_BADGES: Record<string, { bg: string; color: string; label: string }> = {
  scheduled: { bg: "#6366f115", color: "#6366f1", label: "Scheduled" },
  ongoing: { bg: "#f59e0b15", color: "#f59e0b", label: "Ongoing" },
  completed: { bg: "#3b82f615", color: "#3b82f6", label: "Completed" },
  graded: { bg: "#10b98115", color: "#10b981", label: "Graded" },
  cancelled: { bg: "#ef444415", color: "#ef4444", label: "Cancelled" },
};

const Q_TYPE_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  mcq: { bg: "rgba(99, 102, 241, 0.12)", color: "#6366f1", label: "MCQ" },
  short_answer: { bg: "rgba(6, 182, 212, 0.12)", color: "#06b6d4", label: "Short Answer" },
  essay: { bg: "rgba(168, 85, 247, 0.12)", color: "#a855f7", label: "Essay / Rubric" },
  numerical: { bg: "rgba(245, 158, 11, 0.12)", color: "#f59e0b", label: "Numerical" },
};

const DIFFICULTY_COLORS: Record<string, { bg: string; color: string }> = {
  easy: { bg: "rgba(16, 185, 129, 0.12)", color: "#10b981" },
  medium: { bg: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" },
  hard: { bg: "rgba(239, 68, 68, 0.12)", color: "#ef4444" },
};

export default function ExamsPage() {
  const [user, setUser] = useState<{ role: Role; name: string; id?: string; email?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"schedule" | "grading_queue" | "results_processing" | "question_bank" | "variants" | "smart_scheduler">("schedule");

  // Core Data
  const [exams, setExams] = useState<any[]>([]);
  const [questionBank, setQuestionBank] = useState<any[]>([]);
  const [pools, setPools] = useState<any[]>([]);
  const [halls, setHalls] = useState<any[]>([]);
  const [invigilators, setInvigilators] = useState<any[]>([]);
  const [gradingQueue, setGradingQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ═══════════════════════════════════════════════════════════
  // FR-EXAM-03: RESULT PROCESSING, GRADE CURVES & MARKSHEETS
  // ═══════════════════════════════════════════════════════════
  const [selectedExamForResults, setSelectedExamForResults] = useState<any>(null);
  const [examResultsData, setExamResultsData] = useState<any>(null);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [curveType, setCurveType] = useState<"flat_bump" | "percentage_bump" | "scale_to_top" | "sqrt_curve" | "bell_curve">("flat_bump");
  const [curveValue, setCurveValue] = useState<number>(5);
  const [curveTargetMean, setCurveTargetMean] = useState<number>(75);
  const [curveTargetStdDev, setCurveTargetStdDev] = useState<number>(12);
  const [curvePreviewData, setCurvePreviewData] = useState<any>(null);
  const [isApplyingCurve, setIsApplyingCurve] = useState(false);
  const [curveSuccessMsg, setCurveSuccessMsg] = useState("");
  const [showMarksheetModal, setShowMarksheetModal] = useState(false);
  const [activeMarksheetData, setActiveMarksheetData] = useState<any>(null);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [activeTranscriptData, setActiveTranscriptData] = useState<any>(null);
  const [resultsSearch, setResultsSearch] = useState("");
  const [resultsGradeFilter, setResultsGradeFilter] = useState("all");
  const [editingResultId, setEditingResultId] = useState<string | null>(null);
  const [editingScore, setEditingScore] = useState<number>(0);
  const [publicationRemarks, setPublicationRemarks] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);


  // Filters
  const [scheduleFilter, setScheduleFilter] = useState<"all" | "upcoming" | "past">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [qbSearch, setQbSearch] = useState("");
  const [qbTypeFilter, setQbTypeFilter] = useState("all");
  const [qbDifficultyFilter, setQbDifficultyFilter] = useState("all");
  const [qbPoolFilter, setQbPoolFilter] = useState("all");

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [gradingAttempt, setGradingAttempt] = useState<any>(null);
  const [gradingScores, setGradingScores] = useState<Record<string, number>>({});
  const [gradingFeedback, setGradingFeedback] = useState<Record<string, string>>({});
  const [generalRemarks, setGeneralRemarks] = useState("");

  // Variant Studio State
  const [selectedExamForVariants, setSelectedExamForVariants] = useState<any>(null);
  const [examVariants, setExamVariants] = useState<any[]>([]);
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const [variantCount, setVariantCount] = useState(3);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [isGeneratingVariants, setIsGeneratingVariants] = useState(false);

  // Smart Scheduler State
  const [smartScheduleResult, setSmartScheduleResult] = useState<any>(null);
  const [isOptimizingSchedule, setIsOptimizingSchedule] = useState(false);
  const [scheduleSuccessMsg, setScheduleSuccessMsg] = useState("");

  // ═══════════════════════════════════════════════════════════
  // FR-EXAM-02: TIMED ONLINE EXAM & ANTI-CHEATING STATE
  // ═══════════════════════════════════════════════════════════
  const [activeExamSession, setActiveExamSession] = useState<any>(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, any>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [isSubmittingExam, setIsSubmittingExam] = useState(false);
  const [examSubmittedResult, setExamSubmittedResult] = useState<any>(null);
  const [violationCount, setViolationCount] = useState(0);
  const [showCheatingWarning, setShowCheatingWarning] = useState(false);
  const [cheatingMessage, setCheatingMessage] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const violationsLogRef = useRef<any[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Create Exam Form
  const [newTitle, setNewTitle] = useState("");
  const [newCourseCode, setNewCourseCode] = useState("CS301");
  const [newCourseName, setNewCourseName] = useState("Data Structures & Algorithms");
  const [newType, setNewType] = useState("midterm");
  const [newDate, setNewDate] = useState("");
  const [newStartTime, setNewStartTime] = useState("09:00");
  const [newDuration, setNewDuration] = useState(120);
  const [newTotalMarks, setNewTotalMarks] = useState(100);
  const [newPassingMarks, setNewPassingMarks] = useState(40);
  const [newAllowedMaterials, setNewAllowedMaterials] = useState("Non-programmable Scientific Calculator, 1 page handwritten cheat-sheet, Pens/Pencils");
  const [newHallId, setNewHallId] = useState("");
  const [newInvigilatorId, setNewInvigilatorId] = useState("");
  const [newInstructions, setNewInstructions] = useState("Arrive 15 minutes prior to start time. Valid student photo ID required.");

  // Add Question Form
  const [newQCourseCode, setNewQCourseCode] = useState("CS301");
  const [newQCourseName, setNewQCourseName] = useState("Data Structures & Algorithms");
  const [newQTopic, setNewQTopic] = useState("");
  const [newQPoolName, setNewQPoolName] = useState("Midterm Pool - Algorithms");
  const [newQType, setNewQType] = useState<"mcq" | "short_answer" | "essay" | "numerical">("mcq");
  const [newQDifficulty, setNewQDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [newQMarks, setNewQMarks] = useState(5);
  const [newQText, setNewQText] = useState("");
  const [newQOptions, setNewQOptions] = useState(["", "", "", ""]);
  const [newQCorrectAnswer, setNewQCorrectAnswer] = useState("");
  const [newQTolerance, setNewQTolerance] = useState(0);
  const [newQUnit, setNewQUnit] = useState("");
  const [newQRubricCriteria, setNewQRubricCriteria] = useState(["Correct algorithm formulation (5 pts)", "Time & space complexity analysis (5 pts)"]);
  const [newQExplanation, setNewQExplanation] = useState("");

  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessToken") || "";
    }
    return "";
  };

  const fetchData = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    setLoading(true);

    try {
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Exams
      const examsRes = await fetch("http://localhost:3001/exams", { headers });
      if (examsRes.ok) {
        const examsData = await examsRes.json();
        setExams(examsData);
        if (examsData.length > 0) {
          if (!selectedExamForVariants) {
            setSelectedExamForVariants(examsData[0]);
          }
          if (!selectedExamForResults) {
            setSelectedExamForResults(examsData[0]);
            fetchExamResults(examsData[0].id);
          }
        }
      }

      // 2. Question Bank
      const qbRes = await fetch("http://localhost:3001/exams/question-bank", { headers });
      if (qbRes.ok) {
        setQuestionBank(await qbRes.json());
      }

      // 3. Pools
      const poolsRes = await fetch("http://localhost:3001/exams/question-bank/pools", { headers });
      if (poolsRes.ok) {
        setPools(await poolsRes.json());
      }

      // 4. Halls
      const hallsRes = await fetch("http://localhost:3001/exams/halls", { headers });
      if (hallsRes.ok) {
        const hallsData = await hallsRes.json();
        setHalls(hallsData);
        if (hallsData.length > 0) setNewHallId(hallsData[0].id);
      }

      // 5. Invigilators
      const invRes = await fetch("http://localhost:3001/exams/invigilators", { headers });
      if (invRes.ok) {
        const invData = await invRes.json();
        setInvigilators(invData);
        if (invData.length > 0) setNewInvigilatorId(invData[0].id);
      }

      // 6. Manual Grading Queue
      const queueRes = await fetch("http://localhost:3001/exams/attempts/queue", { headers });
      if (queueRes.ok) {
        setGradingQueue(await queueRes.json());
      }
    } catch (err) {
      console.error("Error fetching exams hub data:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedExamForVariants, selectedExamForResults]);

  // ═══════════════════════════════════════════════════════════
  // FR-EXAM-03: RESULTS & GRADE CURVES DATA FETCHERS
  // ═══════════════════════════════════════════════════════════
  const fetchExamResults = useCallback(async (examId: string) => {
    const token = getAuthToken();
    if (!token || !examId) return;
    setIsLoadingResults(true);
    try {
      const res = await fetch(`http://localhost:3001/exams/${examId}/results`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setExamResultsData(data);
      }
    } catch (err) {
      console.error("Failed to load results:", err);
    } finally {
      setIsLoadingResults(false);
    }
  }, []);

  const handlePreviewCurve = async () => {
    if (!selectedExamForResults) return;
    const token = getAuthToken();
    try {
      const res = await fetch(`http://localhost:3001/exams/${selectedExamForResults.id}/curve-preview`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: curveType,
          value: Number(curveValue),
          targetMean: Number(curveTargetMean),
          targetStdDev: Number(curveTargetStdDev),
        }),
      });
      if (res.ok) {
        const preview = await res.json();
        setCurvePreviewData(preview);
      }
    } catch (err) {
      console.error("Preview curve failed:", err);
    }
  };

  const handleApplyCurve = async () => {
    if (!selectedExamForResults) return;
    const token = getAuthToken();
    setIsApplyingCurve(true);
    setCurveSuccessMsg("");
    try {
      const res = await fetch(`http://localhost:3001/exams/${selectedExamForResults.id}/curve-apply`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: curveType,
          value: Number(curveValue),
          targetMean: Number(curveTargetMean),
          targetStdDev: Number(curveTargetStdDev),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurveSuccessMsg(data.message);
        fetchExamResults(selectedExamForResults.id);
        setCurvePreviewData(null);
      }
    } catch (err) {
      console.error("Apply curve failed:", err);
    } finally {
      setIsApplyingCurve(false);
    }
  };

  const handleRevertCurve = async () => {
    if (!selectedExamForResults) return;
    const token = getAuthToken();
    try {
      const res = await fetch(`http://localhost:3001/exams/${selectedExamForResults.id}/curve-revert`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setCurveSuccessMsg("Grade curve reverted successfully. Original raw scores restored.");
        fetchExamResults(selectedExamForResults.id);
        setCurvePreviewData(null);
      }
    } catch (err) {
      console.error("Revert curve failed:", err);
    }
  };

  const handleUpdatePublicationStatus = async (status: string) => {
    if (!selectedExamForResults) return;
    const token = getAuthToken();
    setIsPublishing(true);
    try {
      const res = await fetch(`http://localhost:3001/exams/${selectedExamForResults.id}/publication-status`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, remarks: publicationRemarks }),
      });
      if (res.ok) {
        fetchExamResults(selectedExamForResults.id);
        fetchData();
      }
    } catch (err) {
      console.error("Update publication status failed:", err);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleViewMarksheet = async (studentId: string) => {
    if (!selectedExamForResults) return;
    const token = getAuthToken();
    try {
      const res = await fetch(`http://localhost:3001/exams/${selectedExamForResults.id}/marksheet/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setActiveMarksheetData(data);
        setShowMarksheetModal(true);
      }
    } catch (err) {
      console.error("Failed to load marksheet:", err);
    }
  };

  const handleViewCumulativeTranscript = async (studentId: string) => {
    const token = getAuthToken();
    try {
      const res = await fetch(`http://localhost:3001/exams/transcript/student/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setActiveTranscriptData(data);
        setShowTranscriptModal(true);
      }
    } catch (err) {
      console.error("Failed to load transcript:", err);
    }
  };

  const handleSaveSingleResult = async (studentId: string, studentName: string, newMarks: number) => {
    if (!selectedExamForResults) return;
    const token = getAuthToken();
    try {
      const res = await fetch(`http://localhost:3001/exams/${selectedExamForResults.id}/results`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          results: [
            {
              studentId,
              studentName,
              marksObtained: newMarks,
            },
          ],
        }),
      });
      if (res.ok) {
        setEditingResultId(null);
        fetchExamResults(selectedExamForResults.id);
      }
    } catch (err) {
      console.error("Failed to update result:", err);
    }
  };


  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {}
    }
    fetchData();
  }, [fetchData]);

  // Load variants when selected exam changes
  const loadExamVariants = useCallback(async (examId: string) => {
    const token = getAuthToken();
    if (!token || !examId) return;
    try {
      const res = await fetch(`http://localhost:3001/exams/${examId}/variants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setExamVariants(data);
        setActiveVariantIndex(0);
      }
    } catch (err) {
      console.error("Failed to load variants:", err);
    }
  }, []);

  useEffect(() => {
    if (selectedExamForVariants?.id) {
      loadExamVariants(selectedExamForVariants.id);
    }
  }, [selectedExamForVariants, loadExamVariants]);

  // ═══════════════════════════════════════════════════════════
  // ONLINE EXAM PLAYER TIMERS & ANTI-CHEATING LISTENERS
  // ═══════════════════════════════════════════════════════════

  // Launch Online Exam
  const handleStartOnlineExam = async (exam: any) => {
    const token = getAuthToken();
    try {
      const res = await fetch(`http://localhost:3001/exams/${exam.id}/start-online`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const session = await res.json();
        setActiveExamSession(session);
        setActiveQuestionIndex(0);
        setStudentAnswers({});
        setFlaggedQuestions(new Set());
        setTimeLeftSeconds((session.duration || 120) * 60);
        setViolationCount(0);
        violationsLogRef.current = [];
        setExamSubmittedResult(null);

        // Request Fullscreen
        try {
          if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => {});
            setIsFullscreen(true);
          }
        } catch {}
      }
    } catch (err) {
      console.error("Failed to start online exam:", err);
    }
  };

  // Submit Online Exam
  const handleSubmitOnlineExam = useCallback(async (isAutoSubmit: boolean = false) => {
    if (!activeExamSession || isSubmittingExam) return;
    setIsSubmittingExam(true);
    const token = getAuthToken();

    try {
      const durationTaken = (activeExamSession.duration * 60) - timeLeftSeconds;
      const res = await fetch(`http://localhost:3001/exams/${activeExamSession.examId}/submit-online`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers: studentAnswers,
          durationTakenSeconds: Math.max(0, durationTaken),
          isAutoSubmitted: isAutoSubmit,
          violationCount,
          violationsLog: violationsLogRef.current,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setExamSubmittedResult(result);
        fetchData();
      }
    } catch (err) {
      console.error("Failed to submit exam:", err);
    } finally {
      setIsSubmittingExam(false);
      // Exit fullscreen
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      } catch {}
    }
  }, [activeExamSession, isSubmittingExam, timeLeftSeconds, studentAnswers, violationCount, fetchData]);

  // Timer Tick & Auto-Submit Countdown
  useEffect(() => {
    if (!activeExamSession || examSubmittedResult) return;

    timerRef.current = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // Trigger Auto-Submit!
          handleSubmitOnlineExam(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeExamSession, examSubmittedResult, handleSubmitOnlineExam]);

  // Anti-Cheating: Tab Switch & Window Blur Detection
  useEffect(() => {
    if (!activeExamSession || examSubmittedResult) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const incident = {
          type: "tab_switch",
          message: `Tab switch detected at ${new Date().toLocaleTimeString()}`,
          timestamp: new Date().toISOString(),
        };
        violationsLogRef.current.push(incident);

        setViolationCount((v) => {
          const next = v + 1;
          setCheatingMessage(
            `Academic Integrity Alert: You have switched away from the examination tab (${next} violation${next > 1 ? "s" : ""}). Further infractions may result in immediate disqualification.`
          );
          setShowCheatingWarning(true);
          return next;
        });
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Ctrl+C, Ctrl+V, F12, Ctrl+U
      if ((e.ctrlKey || e.metaKey) && ["c", "v", "u", "a"].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeExamSession, examSubmittedResult]);

  // Format Timer String (HH:MM:SS)
  const formattedTimeLeft = useMemo(() => {
    const hours = Math.floor(timeLeftSeconds / 3600);
    const minutes = Math.floor((timeLeftSeconds % 3600) / 60);
    const seconds = timeLeftSeconds % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }, [timeLeftSeconds]);

  // Toggle Question Flag (Mark for Review)
  const toggleFlagQuestion = (qId: string) => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  // ═══════════════════════════════════════════════════════════
  // MANUAL GRADING QUEUE HANDLERS
  // ═══════════════════════════════════════════════════════════
  const openGradingModal = (attempt: any) => {
    setGradingAttempt(attempt);
    const initialScores: Record<string, number> = {};
    const initialFeedback: Record<string, string> = {};

    Object.values(attempt.answers || {}).forEach((q: any) => {
      if (q.isSubjective) {
        initialScores[q.questionId] = q.awardedMarks !== null ? q.awardedMarks : Math.round(q.maxMarks * 0.7);
        initialFeedback[q.questionId] = q.feedback || "";
      }
    });

    setGradingScores(initialScores);
    setGradingFeedback(initialFeedback);
    setGeneralRemarks(attempt.facultyFeedback || "");
  };

  const handleSaveGradeEvaluation = async () => {
    if (!gradingAttempt) return;
    const token = getAuthToken();

    try {
      const res = await fetch(`http://localhost:3001/exams/attempts/${gradingAttempt.id}/grade`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scores: gradingScores,
          feedback: gradingFeedback,
          generalRemarks,
        }),
      });

      if (res.ok) {
        setGradingAttempt(null);
        fetchData();
      }
    } catch (err) {
      console.error("Grading save failed:", err);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // EXAM CRUD & OTHER ACTIONS
  // ═══════════════════════════════════════════════════════════
  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch("http://localhost:3001/exams", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newTitle,
          courseCode: newCourseCode,
          courseName: newCourseName,
          type: newType,
          date: newDate,
          startTime: newStartTime,
          duration: Number(newDuration),
          totalMarks: Number(newTotalMarks),
          passingMarks: Number(newPassingMarks),
          allowedMaterials: newAllowedMaterials,
          hallId: newHallId,
          invigilatorId: newInvigilatorId,
          instructions: newInstructions,
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        fetchData();
        setNewTitle("");
      }
    } catch (err) {
      console.error("Error creating exam:", err);
    }
  };

  const handleDeleteExam = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to remove this exam and all associated variants?")) return;
    const token = getAuthToken();
    try {
      const res = await fetch(`http://localhost:3001/exams/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) return;

    try {
      let finalAnswer = newQCorrectAnswer;
      if (newQType === "mcq" && !finalAnswer && newQOptions.length > 0) {
        finalAnswer = newQOptions[0];
      }

      const res = await fetch("http://localhost:3001/exams/question-bank", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseCode: newQCourseCode,
          courseName: newQCourseName,
          topic: newQTopic || "General Topic",
          poolName: newQPoolName || "General Pool",
          questionType: newQType,
          difficulty: newQDifficulty,
          marks: Number(newQMarks),
          questionText: newQText,
          options: newQType === "mcq" ? newQOptions.filter(o => o.trim()) : undefined,
          correctAnswer: finalAnswer,
          tolerance: newQType === "numerical" ? Number(newQTolerance) : undefined,
          unit: newQType === "numerical" ? newQUnit : undefined,
          rubricCriteria: newQType === "essay" ? newQRubricCriteria : undefined,
          explanation: newQExplanation,
        }),
      });

      if (res.ok) {
        setShowAddQuestionModal(false);
        fetchData();
        setNewQText("");
        setNewQTopic("");
      }
    } catch (err) {
      console.error("Error adding question:", err);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Delete this question from question bank?")) return;
    const token = getAuthToken();
    try {
      const res = await fetch(`http://localhost:3001/exams/question-bank/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateVariants = async () => {
    if (!selectedExamForVariants) return;
    const token = getAuthToken();
    setIsGeneratingVariants(true);

    try {
      const res = await fetch(`http://localhost:3001/exams/${selectedExamForVariants.id}/generate-variants`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          variantCount,
          shuffleOptions,
          shuffleQuestions,
        }),
      });

      if (res.ok) {
        const generated = await res.json();
        setExamVariants(generated);
        setActiveVariantIndex(0);
        fetchData();
      }
    } catch (err) {
      console.error("Variant generation failed:", err);
    } finally {
      setIsGeneratingVariants(false);
    }
  };

  const handleRunSmartSchedule = async (autoApply: boolean = false) => {
    const token = getAuthToken();
    setIsOptimizingSchedule(true);
    setScheduleSuccessMsg("");

    try {
      const res = await fetch("http://localhost:3001/exams/smart-schedule/generate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ autoApply }),
      });

      if (res.ok) {
        const data = await res.json();
        setSmartScheduleResult(data);
        if (autoApply) {
          setScheduleSuccessMsg(`Successfully applied conflict-free timetable for ${data.totalExams} exams & synchronized with Academic Calendar!`);
          fetchData();
        }
      }
    } catch (err) {
      console.error("Smart scheduler error:", err);
    } finally {
      setIsOptimizingSchedule(false);
    }
  };

  // Filtered Lists
  const filteredExams = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return exams.filter((e) => {
      if (typeFilter !== "all" && e.type !== typeFilter) return false;
      if (scheduleFilter === "upcoming") {
        return e.date >= today && e.status !== "graded";
      }
      if (scheduleFilter === "past") {
        return e.date < today || e.status === "graded";
      }
      return true;
    });
  }, [exams, typeFilter, scheduleFilter]);

  const filteredQuestions = useMemo(() => {
    return questionBank.filter((q) => {
      if (qbTypeFilter !== "all" && q.questionType !== qbTypeFilter) return false;
      if (qbDifficultyFilter !== "all" && q.difficulty !== qbDifficultyFilter) return false;
      if (qbPoolFilter !== "all" && q.poolName !== qbPoolFilter) return false;
      if (qbSearch.trim()) {
        const s = qbSearch.toLowerCase();
        const matchText = (q.questionText || "").toLowerCase().includes(s);
        const matchTopic = (q.topic || "").toLowerCase().includes(s);
        const matchCourse = (q.courseCode || "").toLowerCase().includes(s);
        return matchText || matchTopic || matchCourse;
      }
      return true;
    });
  }, [questionBank, qbTypeFilter, qbDifficultyFilter, qbPoolFilter, qbSearch]);

  const pendingGradingCount = useMemo(() => {
    return gradingQueue.filter((a) => a.status === "needs_grading").length;
  }, [gradingQueue]);

  const activeVariant = examVariants[activeVariantIndex] || null;

  // Active question in player
  const currentExamQuestion = activeExamSession?.questions?.[activeQuestionIndex] || null;

  return (
    <div className="exams-page">
      {/* ─── Hero Banner ─── */}
      <div className="exams-hero">
        <div className="exams-hero-content">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{
              background: "rgba(255, 255, 255, 0.2)",
              color: "#fff",
              padding: "4px 10px",
              borderRadius: 20,
              fontSize: "0.74rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              display: "inline-flex",
              alignItems: "center",
              gap: 6
            }}>
              <Sparkles size={12} /> FR-EXAM-01 & FR-EXAM-02 Platform
            </span>
          </div>
          <h1>Exams & Online Assessment Hub</h1>
          <p>
            Author exams with allowed materials, take timed proctored online assessments with auto-submit & tab-switch detection,
            auto-grade objective responses, and evaluate subjective questions in the manual grading queue.
          </p>
        </div>

        <div className="exams-hero-actions">
          <button
            className="btn-hero-secondary"
            onClick={() => {
              setActiveTab("grading_queue");
            }}
          >
            <CheckSquare size={16} /> Grading Queue {pendingGradingCount > 0 ? `(${pendingGradingCount})` : ""}
          </button>
          <button
            className="btn-hero-secondary"
            onClick={() => {
              setActiveTab("smart_scheduler");
              handleRunSmartSchedule(false);
            }}
          >
            <Cpu size={16} /> Smart Scheduler
          </button>
          {(user?.role === "teacher" || user?.role === "admin") && (
            <>
              <button
                className="btn-hero-secondary"
                onClick={() => setShowAddQuestionModal(true)}
              >
                <Plus size={16} /> Add Question
              </button>
              <button
                className="btn-hero-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <Calendar size={16} /> Schedule Exam
              </button>
            </>
          )}
        </div>
      </div>

      {/* ─── Top Metrics ─── */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-box" style={{ background: "rgba(99, 102, 241, 0.1)", color: "#6366f1" }}>
            <ClipboardList size={24} />
          </div>
          <div>
            <div className="stat-value">{exams.length}</div>
            <div className="stat-label">Total Scheduled Exams</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-box" style={{ background: "rgba(6, 182, 212, 0.1)", color: "#06b6d4" }}>
            <Database size={24} />
          </div>
          <div>
            <div className="stat-value">{questionBank.length}</div>
            <div className="stat-label">Question Bank Items</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-box" style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="stat-value">{pendingGradingCount} Pending</div>
            <div className="stat-label">Manual Grading Queue</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-box" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="stat-value">Active Proctored</div>
            <div className="stat-label">Anti-Cheating Enabled</div>
          </div>
        </div>
      </div>

      {/* ─── Navigation Tabs ─── */}
      <div className="tabs-nav">
        <button
          className={`tab-btn ${activeTab === "schedule" ? "active" : ""}`}
          onClick={() => setActiveTab("schedule")}
        >
          <Calendar size={16} />
          Exams Timetable
          <span className="tab-badge">{filteredExams.length}</span>
        </button>

        <button
          className={`tab-btn ${activeTab === "grading_queue" ? "active" : ""}`}
          onClick={() => setActiveTab("grading_queue")}
        >
          <CheckSquare size={16} />
          Manual Grading Queue
          {pendingGradingCount > 0 ? (
            <span className="tab-badge" style={{ background: "rgba(245, 158, 11, 0.18)", color: "#d97706" }}>
              {pendingGradingCount} Pending
            </span>
          ) : (
            <span className="tab-badge">{gradingQueue.length}</span>
          )}
        </button>

        <button
          className={`tab-btn ${activeTab === "results_processing" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("results_processing");
            if (selectedExamForResults) fetchExamResults(selectedExamForResults.id);
          }}
        >
          <Award size={16} />
          Result Processing & Curves
          <span className="tab-badge" style={{ background: "rgba(16, 185, 129, 0.14)", color: "#059669" }}>
            FR-EXAM-03
          </span>
        </button>

        <button
          className={`tab-btn ${activeTab === "question_bank" ? "active" : ""}`}
          onClick={() => setActiveTab("question_bank")}
        >

          <Database size={16} />
          Question Bank
          <span className="tab-badge">{questionBank.length}</span>
        </button>

        <button
          className={`tab-btn ${activeTab === "variants" ? "active" : ""}`}
          onClick={() => setActiveTab("variants")}
        >
          <Layers size={16} />
          Variant Generator & Papers
          {examVariants.length > 0 && <span className="tab-badge">{examVariants.length} Sets</span>}
        </button>

        <button
          className={`tab-btn ${activeTab === "smart_scheduler" ? "active" : ""}`}
          onClick={() => setActiveTab("smart_scheduler")}
        >
          <Cpu size={16} />
          Smart Schedule Generator
          <span className="tab-badge" style={{ background: "rgba(99, 102, 241, 0.12)", color: "#6366f1" }}>AI Solver</span>
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════════
          TAB 1: EXAMS TIMETABLE & MANAGEMENT
         ════════════════════════════════════════════════════════════ */}
      {activeTab === "schedule" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Filters Bar */}
          <div className="filter-bar">
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "flex", background: "var(--bg-secondary)", borderRadius: 8, padding: 3 }}>
                {(["all", "upcoming", "past"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setScheduleFilter(filter)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 6,
                      border: "none",
                      cursor: "pointer",
                      fontSize: "0.82rem",
                      fontWeight: scheduleFilter === filter ? 600 : 400,
                      background: scheduleFilter === filter ? "var(--bg-primary)" : "transparent",
                      color: scheduleFilter === filter ? "var(--text-primary)" : "var(--text-secondary)",
                      boxShadow: scheduleFilter === filter ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                    }}
                  >
                    {filter === "all" ? "All" : filter === "upcoming" ? "Upcoming" : "Past / Graded"}
                  </button>
                ))}
              </div>

              <select
                className="filter-select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="midterm">Midterms</option>
                <option value="final">Finals</option>
                <option value="quiz">Online Quizzes</option>
                <option value="practical">Practical Labs</option>
                <option value="assignment">Assessments</option>
              </select>
            </div>

            <div style={{ fontSize: "0.84rem", color: "var(--text-secondary)" }}>
              Showing {filteredExams.length} exam{filteredExams.length !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Exam Cards Grid */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {filteredExams.length === 0 ? (
              <div className="card" style={{ padding: 48, textAlign: "center", color: "var(--text-secondary)" }}>
                <ClipboardList size={48} style={{ opacity: 0.3, margin: "0 auto 16px" }} />
                <h3 style={{ fontSize: "1.1rem", marginBottom: 6 }}>No exams found</h3>
                <p style={{ fontSize: "0.86rem" }}>Try adjusting your filters or click Schedule Exam to create one.</p>
              </div>
            ) : (
              filteredExams.map((exam) => {
                const typeColor = TYPE_COLORS[exam.type] || "#6366f1";
                const statusBadge = STATUS_BADGES[exam.status] || STATUS_BADGES.scheduled;

                return (
                  <div key={exam.id} className="exam-card" style={{ borderLeft: `5px solid ${typeColor}` }}>
                    <div className="exam-card-header">
                      <div>
                        <div className="exam-tags-row">
                          <span className="badge-tag" style={{ background: `${typeColor}15`, color: typeColor }}>
                            {exam.type}
                          </span>
                          <span className="badge-tag" style={{ background: statusBadge.bg, color: statusBadge.color }}>
                            {statusBadge.label}
                          </span>
                          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-tertiary)" }}>
                            {exam.courseCode} · {exam.courseName}
                          </span>
                          {exam.hasVariants && (
                            <span className="badge-tag" style={{ background: "rgba(168, 85, 247, 0.12)", color: "#a855f7" }}>
                              🎲 {exam.variantCount || 3} Variants Ready
                            </span>
                          )}
                          {exam.isSmartScheduled && (
                            <span className="badge-tag" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
                              ⚡ Smart Scheduled
                            </span>
                          )}
                        </div>

                        <h3 className="exam-title">{exam.title}</h3>
                      </div>

                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {(user?.role === "teacher" || user?.role === "admin") && (
                          <button
                            onClick={(e) => handleDeleteExam(exam.id, e)}
                            title="Delete Exam"
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "var(--text-tertiary)",
                              cursor: "pointer",
                              padding: 6,
                              borderRadius: 6,
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Meta Grid */}
                    <div className="exam-meta-grid">
                      <div className="meta-item">
                        <Calendar size={16} style={{ color: "#6366f1" }} />
                        <div>
                          <div>Date & Time</div>
                          <strong>
                            {new Date(exam.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at {exam.startTime}
                          </strong>
                        </div>
                      </div>

                      <div className="meta-item">
                        <Clock size={16} style={{ color: "#f59e0b" }} />
                        <div>
                          <div>Duration</div>
                          <strong>{exam.duration} Minutes</strong>
                        </div>
                      </div>

                      <div className="meta-item">
                        <MapPin size={16} style={{ color: "#10b981" }} />
                        <div>
                          <div>Allocated Venue</div>
                          <strong>{exam.hallName || exam.room || "TBD"} {exam.hallCapacity ? `(${exam.hallCapacity} seats)` : ""}</strong>
                        </div>
                      </div>

                      <div className="meta-item">
                        <UserCheck size={16} style={{ color: "#06b6d4" }} />
                        <div>
                          <div>Invigilator</div>
                          <strong>{exam.invigilatorName || "Unassigned"}</strong>
                        </div>
                      </div>

                      <div className="meta-item">
                        <Award size={16} style={{ color: "#a855f7" }} />
                        <div>
                          <div>Marks & Passing</div>
                          <strong>{exam.totalMarks} Marks (Pass: {exam.passingMarks || Math.round(exam.totalMarks * 0.4)})</strong>
                        </div>
                      </div>
                    </div>

                    {/* Allowed Materials Notice */}
                    {exam.allowedMaterials && (
                      <div className="allowed-materials-box">
                        <AlertTriangle size={16} style={{ color: "#f59e0b", flexShrink: 0, marginTop: 2 }} />
                        <div>
                          <strong>Allowed Examination Materials: </strong>
                          <span>{exam.allowedMaterials}</span>
                        </div>
                      </div>
                    )}

                    {/* Card Actions Footer */}
                    <div className="exam-card-actions">
                      <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                        {exam.instructions ? `Note: ${exam.instructions.slice(0, 80)}...` : ""}
                      </div>

                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        {/* FR-EXAM-02 Online Assessment Trigger */}
                        <button
                          onClick={() => handleStartOnlineExam(exam)}
                          style={{
                            background: "linear-gradient(135deg, #4338ca 0%, #6366f1 100%)",
                            color: "#fff",
                            border: "none",
                            padding: "8px 18px",
                            borderRadius: 8,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontWeight: 600,
                            fontSize: "0.85rem",
                            boxShadow: "0 2px 8px rgba(99, 102, 241, 0.25)",
                          }}
                        >
                          <Play size={15} /> Take Online Exam (Proctored)
                        </button>

                        <button
                          onClick={() => {
                            setSelectedExamForVariants(exam);
                            setActiveTab("variants");
                          }}
                          style={{
                            background: "var(--bg-secondary)",
                            color: "var(--text-primary)",
                            border: "1px solid var(--border-primary)",
                            padding: "8px 14px",
                            borderRadius: 8,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: "0.82rem",
                            fontWeight: 500,
                          }}
                        >
                          <Layers size={15} /> {exam.hasVariants ? "View Variants (Sets)" : "Generate Paper Variants"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB 2: MANUAL GRADING QUEUE (FR-EXAM-02)
         ════════════════════════════════════════════════════════════ */}
      {activeTab === "grading_queue" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="filter-bar">
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>
                Subjective Answers Grading Queue
              </h3>
              <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)" }}>
                Review student Short Answer & Essay submissions with model solutions, award question marks, and attach rich inline feedback.
              </p>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <span style={{
                background: "rgba(245, 158, 11, 0.12)",
                color: "#b45309",
                padding: "6px 14px",
                borderRadius: 8,
                fontSize: "0.84rem",
                fontWeight: 600,
              }}>
                {pendingGradingCount} Submissions Awaiting Evaluation
              </span>
            </div>
          </div>

          {/* Queue List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {gradingQueue.length === 0 ? (
              <div className="card" style={{ padding: 48, textAlign: "center", color: "var(--text-secondary)" }}>
                <CheckCircle2 size={48} style={{ opacity: 0.3, color: "#10b981", margin: "0 auto 16px" }} />
                <h3>Grading queue is completely clear!</h3>
                <p style={{ fontSize: "0.86rem" }}>All submitted online exams have been evaluated and graded.</p>
              </div>
            ) : (
              gradingQueue.map((attempt) => {
                const isPending = attempt.status === "needs_grading";

                return (
                  <div key={attempt.id} className="grading-card" style={{ borderLeft: `5px solid ${isPending ? "#f59e0b" : "#10b981"}` }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <span style={{
                          fontSize: "0.74rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          padding: "3px 10px",
                          borderRadius: 6,
                          background: isPending ? "rgba(245, 158, 11, 0.12)" : "rgba(16, 185, 129, 0.12)",
                          color: isPending ? "#b45309" : "#10b981",
                        }}>
                          {isPending ? "Needs Subjective Grading" : "Graded & Published"}
                        </span>
                        <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                          Submitted: {new Date(attempt.submittedAt).toLocaleString()}
                        </span>
                        {attempt.violationCount > 0 ? (
                          <span style={{
                            fontSize: "0.74rem",
                            background: "rgba(239, 68, 68, 0.12)",
                            color: "#ef4444",
                            padding: "3px 8px",
                            borderRadius: 6,
                            fontWeight: 600,
                          }}>
                            ⚠ {attempt.violationCount} Tab Switch Incident{attempt.violationCount > 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span style={{
                            fontSize: "0.74rem",
                            background: "rgba(16, 185, 129, 0.1)",
                            color: "#10b981",
                            padding: "3px 8px",
                            borderRadius: 6,
                          }}>
                            ✓ Clean Proctor Log
                          </span>
                        )}
                      </div>

                      <h4 style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-primary)" }}>
                        {attempt.studentName || "Student"} ({attempt.studentId})
                      </h4>
                      <div style={{ fontSize: "0.84rem", color: "var(--text-secondary)" }}>
                        Exam: <strong>{attempt.examTitle}</strong>
                      </div>
                    </div>

                    {/* Scores & Progress Preview */}
                    <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)" }}>
                          {attempt.totalScore} / {attempt.totalPossibleMarks}
                        </div>
                        <div style={{ fontSize: "0.76rem", color: "var(--text-secondary)" }}>
                          Obj: {attempt.objectiveScore} | Subj: {attempt.subjectiveScore}
                        </div>
                      </div>

                      <button
                        onClick={() => openGradingModal(attempt)}
                        style={{
                          background: isPending ? "var(--accent-primary)" : "var(--bg-secondary)",
                          color: isPending ? "#fff" : "var(--text-primary)",
                          border: isPending ? "none" : "1px solid var(--border-primary)",
                          padding: "10px 18px",
                          borderRadius: 8,
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: "0.84rem",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <PenTool size={15} />
                        {isPending ? "Evaluate Submission" : "Review & Modify"}
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
          TAB 3: QUESTION BANK MANAGEMENT
         ════════════════════════════════════════════════════════════ */}
      {activeTab === "question_bank" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Question Bank Filter Bar */}
          <div className="filter-bar">
            <div className="search-input-wrapper">
              <Search size={16} style={{ color: "var(--text-secondary)" }} />
              <input
                placeholder="Search questions by topic, text, or tags..."
                value={qbSearch}
                onChange={(e) => setQbSearch(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <select
                className="filter-select"
                value={qbTypeFilter}
                onChange={(e) => setQbTypeFilter(e.target.value)}
              >
                <option value="all">All Question Types</option>
                <option value="mcq">MCQ (Multiple Choice)</option>
                <option value="short_answer">Short Answer</option>
                <option value="numerical">Numerical Problem</option>
                <option value="essay">Essay / Rubric</option>
              </select>

              <select
                className="filter-select"
                value={qbDifficultyFilter}
                onChange={(e) => setQbDifficultyFilter(e.target.value)}
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>

              <select
                className="filter-select"
                value={qbPoolFilter}
                onChange={(e) => setQbPoolFilter(e.target.value)}
              >
                <option value="all">All Pools ({pools.length})</option>
                {pools.map((p, idx) => (
                  <option key={idx} value={p.poolName}>
                    {p.poolName} ({p.questionCount} Qs)
                  </option>
                ))}
              </select>

              {(user?.role === "teacher" || user?.role === "admin") && (
                <button
                  onClick={() => setShowAddQuestionModal(true)}
                  style={{
                    background: "var(--text-primary)",
                    color: "var(--bg-primary)",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: 8,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontWeight: 600,
                    fontSize: "0.84rem",
                  }}
                >
                  <Plus size={16} /> New Question
                </button>
              )}
            </div>
          </div>

          {/* Question List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {filteredQuestions.length === 0 ? (
              <div className="card" style={{ padding: 48, textAlign: "center", color: "var(--text-secondary)" }}>
                <Database size={48} style={{ opacity: 0.3, margin: "0 auto 16px" }} />
                <h3>No questions match the selected criteria</h3>
                <p style={{ fontSize: "0.86rem" }}>Try clearing search keywords or change the selected pool.</p>
              </div>
            ) : (
              filteredQuestions.map((q) => {
                const typeStyle = Q_TYPE_COLORS[q.questionType] || Q_TYPE_COLORS.mcq;
                const diffStyle = DIFFICULTY_COLORS[q.difficulty] || DIFFICULTY_COLORS.medium;

                return (
                  <div key={q.id} className="qb-card">
                    <div className="qb-header">
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span className="qb-type-badge" style={{ background: typeStyle.bg, color: typeStyle.color }}>
                          {typeStyle.label}
                        </span>
                        <span className="qb-type-badge" style={{ background: diffStyle.bg, color: diffStyle.color }}>
                          {q.difficulty}
                        </span>
                        <span style={{ fontSize: "0.76rem", fontWeight: 600, color: "var(--text-tertiary)" }}>
                          {q.courseCode} · {q.topic}
                        </span>
                        <span style={{
                          fontSize: "0.74rem",
                          background: "var(--bg-secondary)",
                          padding: "2px 8px",
                          borderRadius: 6,
                          color: "var(--text-secondary)",
                        }}>
                          Pool: {q.poolName}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          color: "#6366f1",
                          background: "rgba(99, 102, 241, 0.08)",
                          padding: "4px 10px",
                          borderRadius: 6,
                        }}>
                          {q.marks} Marks
                        </span>

                        {(user?.role === "teacher" || user?.role === "admin") && (
                          <button
                            onClick={() => handleDeleteQuestion(q.id)}
                            style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer" }}
                            title="Delete Question"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="qb-question-text">{q.questionText}</div>

                    {q.questionType === "mcq" && Array.isArray(q.options) && (
                      <div className="qb-options-grid">
                        {q.options.map((opt: string, optIdx: number) => {
                          const isCorrect = opt === q.correctAnswer;
                          return (
                            <div key={optIdx} className={`qb-option-item ${isCorrect ? "correct" : ""}`}>
                              <span style={{
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: isCorrect ? "#10b981" : "var(--border-primary)",
                                color: isCorrect ? "#fff" : "var(--text-secondary)",
                                fontSize: "0.7rem",
                                fontWeight: 700,
                              }}>
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span>{opt}</span>
                              {isCorrect && <Check size={14} style={{ marginLeft: "auto", color: "#10b981" }} />}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {q.questionType === "short_answer" && (
                      <div className="qb-answer-box">
                        <strong style={{ color: "#6366f1", display: "block", marginBottom: 4 }}>Expected Model Answer:</strong>
                        <span>{q.correctAnswer}</span>
                      </div>
                    )}

                    {q.questionType === "numerical" && (
                      <div className="qb-answer-box" style={{ borderLeftColor: "#f59e0b" }}>
                        <strong style={{ color: "#f59e0b", display: "block", marginBottom: 4 }}>Numerical Target:</strong>
                        <span>Value: <strong>{q.correctAnswer}</strong> {q.unit || ""} (Tolerance: ±{q.tolerance ?? 0})</span>
                      </div>
                    )}

                    {q.questionType === "essay" && Array.isArray(q.rubricCriteria) && (
                      <div className="qb-answer-box" style={{ borderLeftColor: "#a855f7" }}>
                        <strong style={{ color: "#a855f7", display: "block", marginBottom: 6 }}>Scoring Rubric Criteria:</strong>
                        <ul style={{ margin: 0, paddingLeft: 20, fontSize: "0.82rem" }}>
                          {q.rubricCriteria.map((crit: string, cIdx: number) => (
                            <li key={cIdx}>{crit}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {q.explanation && (
                      <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontStyle: "italic", paddingTop: 4 }}>
                        💡 <strong>Marking Guide:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB 4: RANDOM VARIANT GENERATOR & PAPER BUILDER
         ════════════════════════════════════════════════════════════ */}
      {activeTab === "variants" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="variant-studio">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
              <div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                  Random Paper Variant Generator
                </h3>
                <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)" }}>
                  Sample balanced question subsets randomly from pools to generate distinct variants (Set A, Set B, Set C) preventing cheating.
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "0.84rem", fontWeight: 500, color: "var(--text-secondary)" }}>Exam:</span>
                <select
                  className="filter-select"
                  style={{ minWidth: 260 }}
                  value={selectedExamForVariants?.id || ""}
                  onChange={(e) => {
                    const match = exams.find((x) => x.id === e.target.value);
                    if (match) setSelectedExamForVariants(match);
                  }}
                >
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.courseCode}: {ex.title.slice(0, 35)}...
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedExamForVariants && (
              <div style={{
                background: "var(--bg-secondary)",
                borderRadius: 10,
                padding: "14px 18px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 16,
              }}>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: "0.84rem" }}>
                  <span><strong>Date:</strong> {selectedExamForVariants.date} ({selectedExamForVariants.startTime})</span>
                  <span><strong>Duration:</strong> {selectedExamForVariants.duration}m</span>
                  <span><strong>Total Marks:</strong> {selectedExamForVariants.totalMarks}</span>
                  <span><strong>Venue:</strong> {selectedExamForVariants.hallName || selectedExamForVariants.room}</span>
                  <span><strong>Invigilator:</strong> {selectedExamForVariants.invigilatorName || "TBD"}</span>
                </div>

                {(user?.role === "teacher" || user?.role === "admin") && (
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.84rem" }}>
                      <span>Variants:</span>
                      <select
                        value={variantCount}
                        onChange={(e) => setVariantCount(Number(e.target.value))}
                        style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid var(--border-primary)", background: "var(--bg-primary)" }}
                      >
                        <option value={2}>2 Sets (A, B)</option>
                        <option value={3}>3 Sets (A, B, C)</option>
                        <option value={4}>4 Sets (A, B, C, D)</option>
                        <option value={5}>5 Sets (A, B, C, D, E)</option>
                      </select>
                    </div>

                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.84rem", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={shuffleOptions}
                        onChange={(e) => setShuffleOptions(e.target.checked)}
                      />
                      <span>Shuffle MCQ Options</span>
                    </label>

                    <button
                      onClick={handleGenerateVariants}
                      disabled={isGeneratingVariants}
                      style={{
                        background: "var(--accent-primary)",
                        color: "#fff",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: 8,
                        cursor: isGeneratingVariants ? "wait" : "pointer",
                        fontWeight: 600,
                        fontSize: "0.84rem",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <RefreshCw size={15} className={isGeneratingVariants ? "spin" : ""} />
                      {isGeneratingVariants ? "Sampling..." : "Generate Variants"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {examVariants.length > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-primary)", paddingTop: 16 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  {examVariants.map((v, idx) => (
                    <button
                      key={v.id}
                      onClick={() => setActiveVariantIndex(idx)}
                      style={{
                        padding: "8px 18px",
                        borderRadius: 8,
                        border: "1px solid",
                        borderColor: activeVariantIndex === idx ? "#6366f1" : "var(--border-primary)",
                        background: activeVariantIndex === idx ? "rgba(99, 102, 241, 0.12)" : "var(--bg-secondary)",
                        color: activeVariantIndex === idx ? "#6366f1" : "var(--text-primary)",
                        fontWeight: activeVariantIndex === idx ? 700 : 500,
                        cursor: "pointer",
                        fontSize: "0.86rem",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <FileText size={15} />
                      {v.variantCode} ({v.questionCount} Questions)
                    </button>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => setShowAnswerKey(!showAnswerKey)}
                    style={{
                      background: showAnswerKey ? "rgba(16, 185, 129, 0.12)" : "var(--bg-secondary)",
                      color: showAnswerKey ? "#10b981" : "var(--text-primary)",
                      border: "1px solid var(--border-primary)",
                      padding: "8px 14px",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {showAnswerKey ? <EyeOff size={15} /> : <Eye size={15} />}
                    {showAnswerKey ? "Hide Answer Key" : "Show Answer Key & Rubric"}
                  </button>

                  <button
                    onClick={() => window.print()}
                    style={{
                      background: "var(--bg-secondary)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-primary)",
                      padding: "8px 14px",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontSize: "0.82rem",
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Printer size={15} /> Print Paper
                  </button>
                </div>
              </div>
            )}
          </div>

          {activeVariant ? (
            <div className="paper-sheet">
              <div className="paper-header">
                <div style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1.5px", color: "#64748b", marginBottom: 4 }}>
                  Smart University Department of Academic Examinations
                </div>
                <h2>{selectedExamForVariants?.courseName || "Academic Examination"}</h2>
                <div style={{ fontSize: "1.05rem", fontWeight: 600, color: "#334155", marginTop: 4 }}>
                  {activeVariant.title} · Paper Code: {activeVariant.variantCode}
                </div>

                <table className="paper-meta-table">
                  <tbody>
                    <tr>
                      <td><strong>Course:</strong> {selectedExamForVariants?.courseCode}</td>
                      <td><strong>Date:</strong> {selectedExamForVariants?.date}</td>
                      <td><strong>Time:</strong> {selectedExamForVariants?.startTime}</td>
                      <td><strong>Duration:</strong> {selectedExamForVariants?.duration} Minutes</td>
                    </tr>
                    <tr>
                      <td><strong>Venue:</strong> {selectedExamForVariants?.hallName || selectedExamForVariants?.room}</td>
                      <td><strong>Max Marks:</strong> {activeVariant.totalMarks}</td>
                      <td><strong>Passing Marks:</strong> {selectedExamForVariants?.passingMarks || 40}</td>
                      <td><strong>Invigilator:</strong> {selectedExamForVariants?.invigilatorName || "Official Proctored"}</td>
                    </tr>
                  </tbody>
                </table>

                <div style={{
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  padding: "10px 14px",
                  marginTop: 16,
                  textAlign: "left",
                  fontSize: "0.82rem",
                  color: "#334155",
                }}>
                  <div style={{ fontWeight: 700, marginBottom: 4, color: "#0f172a" }}>GENERAL CANDIDATE INSTRUCTIONS:</div>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    <li>Check that this question paper contains {activeVariant.questionCount} questions in total.</li>
                    <li>{selectedExamForVariants?.instructions || "Write your student ID clearly on the answer script."}</li>
                    {selectedExamForVariants?.allowedMaterials && (
                      <li style={{ color: "#b45309", fontWeight: 600 }}>
                        Permitted Materials: {selectedExamForVariants.allowedMaterials}
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              <div>
                {activeVariant.questions.map((q: any, qIdx: number) => {
                  const answerKeyItem = showAnswerKey && activeVariant.answerKey ? activeVariant.answerKey.find((k: any) => k.id === q.id) : null;

                  return (
                    <div key={q.id || qIdx} className="paper-question-item">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.98rem", flex: 1 }}>
                          <span style={{ marginRight: 8 }}>Q{qIdx + 1}.</span>
                          {q.questionText}
                        </div>
                        <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "#4338ca", marginLeft: 16 }}>
                          [{q.marks} Marks]
                        </span>
                      </div>

                      {q.questionType === "mcq" && Array.isArray(q.options) && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px", marginTop: 8, paddingLeft: 24 }}>
                          {q.options.map((opt: string, oIdx: number) => (
                            <div key={oIdx} style={{ fontSize: "0.88rem", color: "#334155" }}>
                              <strong>({String.fromCharCode(65 + oIdx)})</strong> {opt}
                            </div>
                          ))}
                        </div>
                      )}

                      {q.questionType === "numerical" && (
                        <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: 6, paddingLeft: 24, fontStyle: "italic" }}>
                          (State final numerical answer with units where appropriate: {q.unit || "N/A"})
                        </div>
                      )}

                      {showAnswerKey && answerKeyItem && (
                        <div style={{
                          marginTop: 12,
                          background: "#ecfdf5",
                          border: "1px dashed #10b981",
                          borderRadius: 8,
                          padding: "10px 14px",
                          fontSize: "0.84rem",
                          color: "#065f46",
                        }}>
                          <div style={{ fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                            <CheckCircle2 size={16} /> Solution / Marking Rubric for Q{qIdx + 1}:
                          </div>
                          <div><strong>Correct Answer:</strong> {answerKeyItem.correctAnswer}</div>
                          {answerKeyItem.rubricCriteria && (
                            <div style={{ marginTop: 4 }}>
                              <strong>Rubric Points: </strong>
                              {Array.isArray(answerKeyItem.rubricCriteria) ? answerKeyItem.rubricCriteria.join("; ") : answerKeyItem.rubricCriteria}
                            </div>
                          )}
                          {answerKeyItem.explanation && (
                            <div style={{ marginTop: 4, fontStyle: "italic" }}>
                              Guide: {answerKeyItem.explanation}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ textAlign: "center", marginTop: 40, borderTop: "1px solid #cbd5e1", paddingTop: 16, color: "#64748b", fontSize: "0.82rem" }}>
                *** END OF EXAMINATION PAPER ({activeVariant.variantCode}) ***
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 48, textAlign: "center", color: "var(--text-secondary)" }}>
              <Layers size={48} style={{ opacity: 0.3, margin: "0 auto 16px" }} />
              <h3>No variants generated yet for this exam</h3>
              <p style={{ fontSize: "0.86rem", marginBottom: 16 }}>
                Click &ldquo;Generate Variants&rdquo; above to automatically select balanced questions from your Question Bank pools.
              </p>
              {(user?.role === "teacher" || user?.role === "admin") && (
                <button
                  onClick={handleGenerateVariants}
                  style={{
                    background: "var(--accent-primary)",
                    color: "#fff",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: 8,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Generate {variantCount} Sets Now
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB 5: SMART SCHEDULE GENERATOR & HALL ALLOCATION
         ════════════════════════════════════════════════════════════ */}
      {activeTab === "smart_scheduler" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Cpu size={20} style={{ color: "#6366f1" }} />
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    Smart Schedule Generator & Conflict Resolver
                  </h3>
                </div>
                <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", maxWidth: 700 }}>
                  Automates hall allocation based on student enrolled capacity, assigns faculty invigilators with balanced duty counts,
                  and guarantees zero room or time collisions across the entire examination schedule.
                </p>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => handleRunSmartSchedule(false)}
                  disabled={isOptimizingSchedule}
                  style={{
                    background: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-primary)",
                    padding: "10px 18px",
                    borderRadius: 10,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: "0.86rem",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <RefreshCw size={16} className={isOptimizingSchedule ? "spin" : ""} />
                  Test Conflict Solver
                </button>

                {(user?.role === "teacher" || user?.role === "admin") && (
                  <button
                    onClick={() => handleRunSmartSchedule(true)}
                    disabled={isOptimizingSchedule}
                    style={{
                      background: "linear-gradient(135deg, #4338ca 0%, #6366f1 100%)",
                      color: "#fff",
                      border: "none",
                      padding: "10px 20px",
                      borderRadius: 10,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontSize: "0.86rem",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      boxShadow: "0 4px 14px rgba(99, 102, 241, 0.3)",
                    }}
                  >
                    <Sparkles size={16} />
                    Apply & Sync to Calendar
                  </button>
                )}
              </div>
            </div>

            {scheduleSuccessMsg && (
              <div style={{
                marginTop: 16,
                background: "rgba(16, 185, 129, 0.1)",
                border: "1px solid #10b981",
                borderRadius: 8,
                padding: "12px 16px",
                color: "#10b981",
                fontSize: "0.88rem",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}>
                <CheckCircle2 size={18} />
                <span>{scheduleSuccessMsg}</span>
              </div>
            )}
          </div>

          <div>
            <h4 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
              Campus Examination Venues & Capacity
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
              {halls.map((hall) => {
                let facilitiesList: string[] = [];
                try {
                  facilitiesList = typeof hall.facilities === "string" ? JSON.parse(hall.facilities) : (hall.facilities || []);
                } catch {
                  facilitiesList = [];
                }

                return (
                  <div key={hall.id} className="card" style={{ padding: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: "0.74rem", textTransform: "uppercase", color: "var(--text-tertiary)", fontWeight: 600 }}>
                          {hall.building} · {hall.roomNumber}
                        </div>
                        <h4 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>
                          {hall.name}
                        </h4>
                      </div>
                      <span style={{
                        background: "rgba(99, 102, 241, 0.12)",
                        color: "#6366f1",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        padding: "4px 8px",
                        borderRadius: 6,
                      }}>
                        {hall.capacity} Seats
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                      {facilitiesList.map((f, fIdx) => (
                        <span key={fIdx} style={{
                          fontSize: "0.72rem",
                          background: "var(--bg-secondary)",
                          color: "var(--text-secondary)",
                          padding: "3px 8px",
                          borderRadius: 6,
                        }}>
                          ✓ {f}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {smartScheduleResult && (
            <div className="card" style={{ padding: 24, overflowX: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h4 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    Automated Schedule & Allocation Grid
                  </h4>
                  <div style={{ fontSize: "0.84rem", color: "var(--text-secondary)" }}>
                    Analyzed {smartScheduleResult.totalExams} examinations with {smartScheduleResult.hallsUtilized} halls and {smartScheduleResult.invigilatorsAssigned} invigilators
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <span className="conflict-pill free">
                    ✓ {smartScheduleResult.allocatedSuccessfully} Conflict-Free
                  </span>
                  {smartScheduleResult.conflictsDetected > 0 && (
                    <span className="conflict-pill warning">
                      ⚠ {smartScheduleResult.conflictsDetected} Warnings
                    </span>
                  )}
                </div>
              </div>

              <table className="scheduler-table">
                <thead>
                  <tr>
                    <th>Exam & Course</th>
                    <th>Date & Time</th>
                    <th>Enrolled</th>
                    <th>Allocated Venue</th>
                    <th>Assigned Invigilator</th>
                    <th>Conflict Status</th>
                  </tr>
                </thead>
                <tbody>
                  {smartScheduleResult.schedulePlan.map((plan: any, pIdx: number) => (
                    <tr key={pIdx}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{plan.title}</div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{plan.courseCode} · {plan.courseName}</div>
                      </td>
                      <td>
                        <div>{plan.date}</div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{plan.startTime} ({plan.duration}m)</div>
                      </td>
                      <td>
                        <strong>{plan.enrolledCount} Students</strong>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: "#6366f1" }}>{plan.hallName}</div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>Capacity: {plan.hallCapacity} seats</div>
                      </td>
                      <td>
                        <div><strong>{plan.invigilatorName}</strong></div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{plan.invigilatorEmail}</div>
                      </td>
                      <td>
                        <span className={`conflict-pill ${plan.status === "ALLOCATED" ? "free" : "warning"}`}>
                          {plan.status === "ALLOCATED" ? "✓ Conflict-Free" : "⚠ Room Capacity Warning"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          FR-EXAM-03: RESULT PROCESSING, GRADE CURVES & MARKSHEETS
         ════════════════════════════════════════════════════════════ */}
      {activeTab === "results_processing" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* 1. Exam Selection & Controlled Publication Header Bar */}
          <div className="card" style={{ padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
                    Select Course Examination
                  </label>
                  <select
                    value={selectedExamForResults?.id || ""}
                    onChange={(e) => {
                      const exam = exams.find((x) => x.id === e.target.value);
                      if (exam) {
                        setSelectedExamForResults(exam);
                        fetchExamResults(exam.id);
                        setCurvePreviewData(null);
                        setCurveSuccessMsg("");
                      }
                    }}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 10,
                      border: "1px solid var(--border-primary)",
                      background: "var(--bg-secondary)",
                      color: "var(--text-primary)",
                      fontSize: "0.92rem",
                      fontWeight: 600,
                      minWidth: 320,
                    }}
                  >
                    {exams.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.courseCode} · {ex.title} ({ex.totalMarks} Marks)
                      </option>
                    ))}
                  </select>
                </div>

                {selectedExamForResults && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 20 }}>
                    <span className="exam-type-pill" style={{ background: TYPE_COLORS[selectedExamForResults.type] || "#6366f1", color: "#fff" }}>
                      {selectedExamForResults.type.toUpperCase()}
                    </span>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      Pass Mark: <strong>{selectedExamForResults.passingMarks}/{selectedExamForResults.totalMarks}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Publication Status & Controlled Visibility Workflow */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
                    Publication Visibility
                  </div>
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 12px",
                    borderRadius: 20,
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    background: examResultsData?.isPublished
                      ? "rgba(16, 185, 129, 0.15)"
                      : examResultsData?.publicationStatus === "approved"
                      ? "rgba(59, 130, 246, 0.15)"
                      : examResultsData?.publicationStatus === "pending_approval"
                      ? "rgba(245, 158, 11, 0.15)"
                      : "rgba(100, 116, 139, 0.15)",
                    color: examResultsData?.isPublished
                      ? "#10b981"
                      : examResultsData?.publicationStatus === "approved"
                      ? "#3b82f6"
                      : examResultsData?.publicationStatus === "pending_approval"
                      ? "#f59e0b"
                      : "#64748b",
                  }}>
                    <span style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: examResultsData?.isPublished ? "#10b981" : "#f59e0b",
                    }} />
                    {examResultsData?.isPublished
                      ? "Published to Students"
                      : examResultsData?.publicationStatus === "approved"
                      ? "Dean Approved (Ready)"
                      : examResultsData?.publicationStatus === "pending_approval"
                      ? "Pending Moderation"
                      : "Draft (Private)"}
                  </div>
                </div>

                {/* Workflow Action Buttons */}
                {(user?.role === "admin" || user?.role === "teacher") && (
                  <div style={{ display: "flex", gap: 8 }}>
                    {!examResultsData?.isPublished && examResultsData?.publicationStatus !== "approved" && (
                      <button
                        onClick={() => handleUpdatePublicationStatus("approved")}
                        disabled={isPublishing}
                        style={{
                          padding: "9px 16px",
                          borderRadius: 8,
                          border: "1px solid #3b82f6",
                          background: "rgba(59, 130, 246, 0.1)",
                          color: "#3b82f6",
                          fontWeight: 600,
                          fontSize: "0.84rem",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <CheckCircle2 size={15} /> Approve Results
                      </button>
                    )}

                    {!examResultsData?.isPublished && (
                      <button
                        onClick={() => {
                          if (confirm("Publish official results? Students will immediately receive notifications and have access to their verified marksheets.")) {
                            handleUpdatePublicationStatus("published");
                          }
                        }}
                        disabled={isPublishing}
                        style={{
                          padding: "9px 18px",
                          borderRadius: 8,
                          border: "none",
                          background: "#10b981",
                          color: "#fff",
                          fontWeight: 600,
                          fontSize: "0.84rem",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                        }}
                      >
                        <Send size={15} /> {isPublishing ? "Publishing..." : "Publish to Students"}
                      </button>
                    )}

                    {examResultsData?.isPublished && (
                      <button
                        onClick={() => {
                          if (confirm("Revoke publication? Results will become hidden from student view.")) {
                            handleUpdatePublicationStatus("draft");
                          }
                        }}
                        disabled={isPublishing}
                        style={{
                          padding: "9px 16px",
                          borderRadius: 8,
                          border: "1px solid var(--border-primary)",
                          background: "var(--bg-secondary)",
                          color: "#ef4444",
                          fontWeight: 600,
                          fontSize: "0.84rem",
                          cursor: "pointer",
                        }}
                      >
                        Revoke Publication
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Controlled Visibility Notice */}
            <div style={{
              marginTop: 16,
              padding: "10px 16px",
              borderRadius: 8,
              background: examResultsData?.isPublished ? "rgba(16, 185, 129, 0.08)" : "rgba(245, 158, 11, 0.08)",
              border: `1px solid ${examResultsData?.isPublished ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)"}`,
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: "0.84rem",
              color: examResultsData?.isPublished ? "#059669" : "#d97706",
            }}>
              {examResultsData?.isPublished ? (
                <>
                  <CheckCircle2 size={16} />
                  <span><strong>Official Publication Active:</strong> All enrolled candidates have access to verified marksheets and transcript records.</span>
                </>
              ) : (
                <>
                  <EyeOff size={16} />
                  <span><strong>Controlled Visibility Enforcement:</strong> Results and marksheets are private to examiners and faculty. Official release requires administrative approval.</span>
                </>
              )}
            </div>
          </div>

          {/* 2. Statistical Analysis Dashboard */}
          {examResultsData?.stats && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* 6 Metric KPI Cards */}
              <div className="results-kpi-grid">
                <div className="results-kpi-card">
                  <div className="kpi-title">
                    <Calculator size={14} color="#6366f1" /> Class Mean
                  </div>
                  <div className="kpi-value" style={{ color: "#6366f1" }}>
                    {examResultsData.stats.mean}
                    <span style={{ fontSize: "0.95rem", fontWeight: 500, color: "var(--text-secondary)" }}>
                      /{selectedExamForResults?.totalMarks || 100}
                    </span>
                  </div>
                  <div className="kpi-subtext">Cohort Average: {examResultsData.stats.meanPercentage}%</div>
                </div>

                <div className="results-kpi-card">
                  <div className="kpi-title">
                    <Hash size={14} color="#06b6d4" /> Median
                  </div>
                  <div className="kpi-value" style={{ color: "#06b6d4" }}>
                    {examResultsData.stats.median}
                  </div>
                  <div className="kpi-subtext">50th percentile midpoint</div>
                </div>

                <div className="results-kpi-card">
                  <div className="kpi-title">
                    <Sparkles size={14} color="#a855f7" /> Std Deviation
                  </div>
                  <div className="kpi-value" style={{ color: "#a855f7" }}>
                    ±{examResultsData.stats.stdDev}
                  </div>
                  <div className="kpi-subtext">Spread & variance index</div>
                </div>

                <div className="results-kpi-card">
                  <div className="kpi-title">
                    <CheckCircle2 size={14} color="#10b981" /> Pass Rate
                  </div>
                  <div className="kpi-value" style={{ color: "#10b981" }}>
                    {examResultsData.stats.passPercentage}%
                  </div>
                  <div className="kpi-subtext">
                    {examResultsData.stats.passCount} passed · {examResultsData.stats.failCount} failed
                  </div>
                </div>

                <div className="results-kpi-card">
                  <div className="kpi-title">
                    <Award size={14} color="#f59e0b" /> Score Range
                  </div>
                  <div className="kpi-value" style={{ color: "#f59e0b" }}>
                    {examResultsData.stats.highestScore}
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                      {" "}to {examResultsData.stats.lowestScore}
                    </span>
                  </div>
                  <div className="kpi-subtext">Spread: {examResultsData.stats.highestScore - examResultsData.stats.lowestScore} pts</div>
                </div>

                <div className="results-kpi-card">
                  <div className="kpi-title">
                    <Layers size={14} color="#ec4899" /> Quartiles
                  </div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginTop: 4 }}>
                    Q1: {examResultsData.stats.percentiles.q1} · Q3: {examResultsData.stats.percentiles.q3}
                  </div>
                  <div className="kpi-subtext">Top 10% (P90): {examResultsData.stats.percentiles.p90}+</div>
                </div>
              </div>

              {/* Grade Distribution & Frequency Histogram */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
                {/* Grade Distribution Bar Chart */}
                <div className="card" style={{ padding: 22 }}>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: 16, color: "var(--text-primary)" }}>
                    Letter Grade Distribution
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {Object.entries(examResultsData.stats.gradeDistribution || {}).map(([grd, val]: [string, any]) => {
                      const barColor = grd.startsWith("A") ? "#10b981" : grd.startsWith("B") ? "#6366f1" : grd.startsWith("C") ? "#f59e0b" : grd === "D" ? "#ea580c" : "#ef4444";
                      return (
                        <div key={grd} style={{ display: "grid", gridTemplateColumns: "40px 1fr 100px", alignItems: "center", gap: 12 }}>
                          <span style={{ fontWeight: 700, fontSize: "0.9rem", color: barColor }}>{grd}</span>
                          <div className="grade-bar-track">
                            <div
                              className="grade-bar-fill"
                              style={{ width: `${Math.max(val.percentage, 2)}%`, background: barColor }}
                            />
                          </div>
                          <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", textAlign: "right" }}>
                            <strong>{val.count}</strong> ({val.percentage}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Frequency Range Bins */}
                <div className="card" style={{ padding: 22, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: 16, color: "var(--text-primary)" }}>
                      Score Ranges
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {examResultsData.stats.histogram?.map((bin: any) => (
                        <div key={bin.range} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--bg-secondary)", borderRadius: 8 }}>
                          <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{bin.range}</span>
                          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#6366f1" }}>
                            {bin.count} Student{bin.count !== 1 ? "s" : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(99, 102, 241, 0.05)", borderRadius: 8, fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                    Total Graded Submissions: <strong>{examResultsData.stats.gradedCount}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. Admin-Configurable Grade Curve Studio */}
          {(user?.role === "admin" || user?.role === "teacher") && (
            <div className="curve-studio-box">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Sparkles size={18} color="#6366f1" />
                    <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)" }}>
                      Grade Curve Engine (Admin Configurable)
                    </h3>
                  </div>
                  <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)", marginTop: 4 }}>
                    Apply academic scaling models to adjust for assessment difficulty while preserving relative candidate rankings.
                  </p>
                </div>

                {examResultsData?.curveConfig ? (
                  <span style={{ background: "rgba(16, 185, 129, 0.15)", color: "#059669", padding: "6px 14px", borderRadius: 20, fontSize: "0.82rem", fontWeight: 700 }}>
                    ✓ Applied: {examResultsData.curveConfig.type?.replace("_", " ").toUpperCase()} ({examResultsData.curveConfig.value || ""})
                  </span>
                ) : (
                  <span style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)", padding: "6px 14px", borderRadius: 20, fontSize: "0.82rem", fontWeight: 600 }}>
                    Raw Uncurved Scores
                  </span>
                )}
              </div>

              {/* Curve Selection Tabs */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  className={`curve-preset-btn ${curveType === "flat_bump" ? "active" : ""}`}
                  onClick={() => { setCurveType("flat_bump"); setCurvePreviewData(null); }}
                >
                  Flat Point Bump (+k)
                </button>
                <button
                  className={`curve-preset-btn ${curveType === "percentage_bump" ? "active" : ""}`}
                  onClick={() => { setCurveType("percentage_bump"); setCurvePreviewData(null); }}
                >
                  Percentage Bump (+p%)
                </button>
                <button
                  className={`curve-preset-btn ${curveType === "scale_to_top" ? "active" : ""}`}
                  onClick={() => { setCurveType("scale_to_top"); setCurvePreviewData(null); }}
                >
                  Scale to Top Score (100%)
                </button>
                <button
                  className={`curve-preset-btn ${curveType === "sqrt_curve" ? "active" : ""}`}
                  onClick={() => { setCurveType("sqrt_curve"); setCurvePreviewData(null); }}
                >
                  Square Root Curve (√x × 10)
                </button>
                <button
                  className={`curve-preset-btn ${curveType === "bell_curve" ? "active" : ""}`}
                  onClick={() => { setCurveType("bell_curve"); setCurvePreviewData(null); }}
                >
                  Gaussian Bell Curve (Normal)
                </button>
              </div>

              {/* Curve Parameters Configuration */}
              <div style={{ background: "var(--bg-primary)", padding: 18, borderRadius: 10, border: "1px solid var(--border-primary)", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                {curveType === "flat_bump" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Points to Add to Each Candidate:</label>
                    <input
                      type="number"
                      min={1}
                      max={25}
                      value={curveValue}
                      onChange={(e) => setCurveValue(Number(e.target.value))}
                      style={{ width: 80, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border-primary)", fontWeight: 700 }}
                    />
                    <input
                      type="range"
                      min={1}
                      max={20}
                      value={curveValue}
                      onChange={(e) => setCurveValue(Number(e.target.value))}
                      style={{ width: 140 }}
                    />
                  </div>
                )}

                {curveType === "percentage_bump" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Percentage Boost (%):</label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={curveValue}
                      onChange={(e) => setCurveValue(Number(e.target.value))}
                      style={{ width: 80, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border-primary)", fontWeight: 700 }}
                    />
                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Scales candidate scores by (1 + p/100)</span>
                  </div>
                )}

                {curveType === "scale_to_top" && (
                  <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    Scales the highest score ({examResultsData?.stats?.highestScore} pts) up to 100%, and scales all remaining scores proportionally.
                  </div>
                )}

                {curveType === "sqrt_curve" && (
                  <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    Applies the classic standard curve formula: <code>curved = √(score / 100) × 100</code>. Provides a higher boost to lower scores while tapering at the top.
                  </div>
                )}

                {curveType === "bell_curve" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div>
                      <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block" }}>Target Mean:</label>
                      <input
                        type="number"
                        value={curveTargetMean}
                        onChange={(e) => setCurveTargetMean(Number(e.target.value))}
                        style={{ width: 70, padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border-primary)" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block" }}>Target Std Dev:</label>
                      <input
                        type="number"
                        value={curveTargetStdDev}
                        onChange={(e) => setCurveTargetStdDev(Number(e.target.value))}
                        style={{ width: 70, padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border-primary)" }}
                      />
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, marginLeft: "auto" }}>
                  <button
                    onClick={handlePreviewCurve}
                    style={{
                      padding: "9px 18px",
                      borderRadius: 8,
                      border: "1px solid #6366f1",
                      background: "rgba(99, 102, 241, 0.1)",
                      color: "#6366f1",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontSize: "0.85rem",
                    }}
                  >
                    Simulate & Preview Curve
                  </button>

                  <button
                    onClick={handleApplyCurve}
                    disabled={isApplyingCurve}
                    style={{
                      padding: "9px 20px",
                      borderRadius: 8,
                      border: "none",
                      background: "var(--accent-primary)",
                      color: "#fff",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontSize: "0.85rem",
                    }}
                  >
                    {isApplyingCurve ? "Applying..." : "Commit Curve to Class"}
                  </button>

                  {examResultsData?.curveConfig && (
                    <button
                      onClick={handleRevertCurve}
                      style={{
                        padding: "9px 16px",
                        borderRadius: 8,
                        border: "1px solid var(--border-primary)",
                        background: "transparent",
                        color: "var(--text-secondary)",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                      }}
                    >
                      Revert to Raw
                    </button>
                  )}
                </div>
              </div>

              {/* Curve Success Message */}
              {curveSuccessMsg && (
                <div style={{ padding: "10px 14px", background: "rgba(16, 185, 129, 0.12)", color: "#059669", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600 }}>
                  ✓ {curveSuccessMsg}
                </div>
              )}

              {/* Curve Preview Comparison Drawer */}
              {curvePreviewData && (
                <div style={{ background: "var(--bg-primary)", padding: 20, borderRadius: 12, border: "2px solid #6366f1", display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: 700, fontSize: "1rem", color: "#6366f1" }}>
                      Curving Simulation Preview (Not Yet Committed)
                    </div>
                    <button
                      onClick={() => setCurvePreviewData(null)}
                      style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                    <div style={{ background: "var(--bg-secondary)", padding: 14, borderRadius: 8 }}>
                      <div style={{ fontSize: "0.76rem", color: "var(--text-secondary)" }}>Mean Score Delta</div>
                      <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)" }}>
                        {curvePreviewData.beforeStats.mean} → {curvePreviewData.afterStats.mean}{" "}
                        <span style={{ fontSize: "0.85rem", color: "#10b981" }}>
                          (+{(curvePreviewData.afterStats.mean - curvePreviewData.beforeStats.mean).toFixed(1)})
                        </span>
                      </div>
                    </div>

                    <div style={{ background: "var(--bg-secondary)", padding: 14, borderRadius: 8 }}>
                      <div style={{ fontSize: "0.76rem", color: "var(--text-secondary)" }}>Pass Rate Impact</div>
                      <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)" }}>
                        {curvePreviewData.beforeStats.passPercentage}% → {curvePreviewData.afterStats.passPercentage}%
                      </div>
                    </div>

                    <div style={{ background: "var(--bg-secondary)", padding: 14, borderRadius: 8 }}>
                      <div style={{ fontSize: "0.76rem", color: "var(--text-secondary)" }}>Std Deviation</div>
                      <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)" }}>
                        ±{curvePreviewData.beforeStats.stdDev} → ±{curvePreviewData.afterStats.stdDev}
                      </div>
                    </div>
                  </div>

                  {/* Sample Candidate Impact */}
                  <div style={{ fontSize: "0.84rem", color: "var(--text-secondary)" }}>
                    Sample Impact on Candidates:
                  </div>
                  <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6 }}>
                    {curvePreviewData.previewResults.slice(0, 6).map((cand: any) => (
                      <div key={cand.id} style={{ minWidth: 160, padding: 10, background: "var(--bg-secondary)", borderRadius: 8, border: "1px solid var(--border-primary)" }}>
                        <div style={{ fontWeight: 600, fontSize: "0.82rem" }}>{cand.studentName}</div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 2 }}>
                          {cand.originalMarks} → <strong style={{ color: "#6366f1" }}>{cand.curvedMarks}</strong> (+{cand.adjustment})
                        </div>
                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#10b981", marginTop: 4 }}>
                          Grade: {cand.originalGrade} → {cand.curvedGrade}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. Results Directory & Marksheet Generation Table */}
          <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
              <div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  Candidate Result Register & Marksheet Directory
                </h3>
                <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                  Instant marksheet generation, score auditing, and transcript verification.
                </div>
              </div>

              {/* Filter controls */}
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ position: "relative" }}>
                  <Search size={15} style={{ position: "absolute", left: 10, top: 10, color: "var(--text-secondary)" }} />
                  <input
                    placeholder="Search candidate..."
                    value={resultsSearch}
                    onChange={(e) => setResultsSearch(e.target.value)}
                    style={{ padding: "8px 12px 8px 32px", borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-secondary)", fontSize: "0.84rem" }}
                  />
                </div>

                <select
                  value={resultsGradeFilter}
                  onChange={(e) => setResultsGradeFilter(e.target.value)}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-secondary)", fontSize: "0.84rem" }}
                >
                  <option value="all">All Grades</option>
                  <option value="A+">Grade A+</option>
                  <option value="A">Grade A</option>
                  <option value="B">Grade B</option>
                  <option value="C">Grade C</option>
                  <option value="D">Grade D</option>
                  <option value="F">Grade F (Fail)</option>
                </select>
              </div>
            </div>

            {/* Results Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border-primary)", textAlign: "left", color: "var(--text-secondary)" }}>
                    <th style={{ padding: "12px 14px" }}>Candidate</th>
                    <th style={{ padding: "12px 14px" }}>Raw Score</th>
                    <th style={{ padding: "12px 14px" }}>Curve Adj.</th>
                    <th style={{ padding: "12px 14px" }}>Final Marks</th>
                    <th style={{ padding: "12px 14px" }}>Percentage</th>
                    <th style={{ padding: "12px 14px" }}>Grade</th>
                    <th style={{ padding: "12px 14px" }}>GP</th>
                    <th style={{ padding: "12px 14px" }}>Status</th>
                    <th style={{ padding: "12px 14px", textAlign: "right" }}>Official Documents</th>
                  </tr>
                </thead>
                <tbody>
                  {examResultsData?.results
                    ?.filter((r: any) => {
                      if (resultsGradeFilter !== "all" && r.grade !== resultsGradeFilter) return false;
                      if (resultsSearch.trim()) {
                        const s = resultsSearch.toLowerCase();
                        return (
                          r.studentName?.toLowerCase().includes(s) ||
                          r.studentId?.toLowerCase().includes(s)
                        );
                      }
                      return true;
                    })
                    .map((res: any) => {
                      const isPassing = (res.marksObtained || 0) >= (selectedExamForResults?.passingMarks || 40);
                      const isEditing = editingResultId === res.id;

                      return (
                        <tr key={res.id} style={{ borderBottom: "1px solid var(--border-primary)" }}>
                          <td style={{ padding: "14px" }}>
                            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{res.studentName}</div>
                            <div style={{ fontSize: "0.76rem", color: "var(--text-secondary)" }}>
                              ID: {res.studentId} · {res.studentEmail || "student@sdms.edu"}
                            </div>
                          </td>

                          <td style={{ padding: "14px" }}>
                            {res.originalMarks !== null ? res.originalMarks : res.marksObtained}
                          </td>

                          <td style={{ padding: "14px" }}>
                            {res.curveAdjustment ? (
                              <span style={{ padding: "2px 8px", borderRadius: 12, background: "rgba(16, 185, 129, 0.12)", color: "#10b981", fontWeight: 700, fontSize: "0.8rem" }}>
                                +{res.curveAdjustment}
                              </span>
                            ) : (
                              <span style={{ color: "var(--text-tertiary)" }}>—</span>
                            )}
                          </td>

                          <td style={{ padding: "14px" }}>
                            {isEditing ? (
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <input
                                  type="number"
                                  value={editingScore}
                                  onChange={(e) => setEditingScore(Number(e.target.value))}
                                  style={{ width: 64, padding: "4px 8px", borderRadius: 6, border: "1px solid #6366f1" }}
                                />
                                <button
                                  onClick={() => handleSaveSingleResult(res.studentId, res.studentName, editingScore)}
                                  style={{ padding: "4px 8px", background: "#10b981", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: "0.75rem" }}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingResultId(null)}
                                  style={{ padding: "4px 6px", background: "transparent", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <strong style={{ fontSize: "0.95rem" }}>{res.marksObtained}</strong>
                                <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                                  /{res.totalMarks || 100}
                                </span>
                                {(user?.role === "admin" || user?.role === "teacher") && (
                                  <button
                                    onClick={() => {
                                      setEditingResultId(res.id);
                                      setEditingScore(res.marksObtained);
                                    }}
                                    style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: 2 }}
                                    title="Quick edit score"
                                  >
                                    <PenTool size={12} />
                                  </button>
                                )}
                              </div>
                            )}
                          </td>

                          <td style={{ padding: "14px", fontWeight: 600 }}>{res.percentage}%</td>

                          <td style={{ padding: "14px" }}>
                            <span style={{
                              padding: "4px 10px",
                              borderRadius: 14,
                              fontSize: "0.8rem",
                              fontWeight: 700,
                              background: res.grade?.startsWith("A") ? "rgba(16, 185, 129, 0.15)" : res.grade?.startsWith("B") ? "rgba(99, 102, 241, 0.15)" : res.grade?.startsWith("C") ? "rgba(245, 158, 11, 0.15)" : "rgba(239, 68, 68, 0.15)",
                              color: res.grade?.startsWith("A") ? "#10b981" : res.grade?.startsWith("B") ? "#6366f1" : res.grade?.startsWith("C") ? "#f59e0b" : "#ef4444",
                            }}>
                              {res.grade}
                            </span>
                          </td>

                          <td style={{ padding: "14px", fontWeight: 600 }}>{res.gradePoint?.toFixed(1) || "—"}</td>

                          <td style={{ padding: "14px" }}>
                            <span style={{
                              fontSize: "0.78rem",
                              fontWeight: 600,
                              color: isPassing ? "#10b981" : "#ef4444",
                            }}>
                              {isPassing ? "✓ Pass" : "✕ Re-appear"}
                            </span>
                          </td>

                          <td style={{ padding: "14px", textAlign: "right" }}>
                            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                              <button
                                onClick={() => handleViewMarksheet(res.studentId)}
                                style={{
                                  padding: "6px 12px",
                                  borderRadius: 6,
                                  border: "1px solid var(--border-primary)",
                                  background: "var(--bg-secondary)",
                                  fontSize: "0.78rem",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 5,
                                }}
                              >
                                <Award size={13} color="#6366f1" /> Marksheet
                              </button>

                              <button
                                onClick={() => handleViewCumulativeTranscript(res.studentId)}
                                style={{
                                  padding: "6px 12px",
                                  borderRadius: 6,
                                  border: "1px solid var(--border-primary)",
                                  background: "var(--bg-secondary)",
                                  fontSize: "0.78rem",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 5,
                                }}
                              >
                                <FileText size={13} color="#06b6d4" /> Transcript
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          FR-EXAM-02: FULLSCREEN ONLINE ASSESSMENT PLAYER
         ════════════════════════════════════════════════════════════ */}

      {activeExamSession && (
        <div className="assessment-player-overlay">
          {/* Top Bar */}
          <div className="player-topbar">
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  {activeExamSession.title}
                </h3>
                <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                  {activeExamSession.courseCode} · Candidate: {user?.name || "Student"}
                </div>
              </div>
            </div>

            {/* Countdown Timer */}
            <div className={`timer-pill ${timeLeftSeconds < 120 ? "danger" : timeLeftSeconds < 600 ? "warning" : ""}`}>
              <Clock size={18} />
              <span>{formattedTimeLeft}</span>
            </div>

            {/* Anti-Cheating & Action Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className={`proctor-shield-pill ${violationCount > 0 ? "violation" : ""}`}>
                <ShieldAlert size={15} />
                <span>
                  {violationCount === 0 ? "Proctoring Active" : `${violationCount} Violation${violationCount > 1 ? "s" : ""}`}
                </span>
              </div>

              <button
                onClick={() => {
                  if (confirm("Are you ready to submit your exam responses? You cannot modify answers after submission.")) {
                    handleSubmitOnlineExam(false);
                  }
                }}
                disabled={isSubmittingExam}
                style={{
                  background: "var(--accent-primary)",
                  color: "#fff",
                  border: "none",
                  padding: "8px 18px",
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Send size={15} />
                {isSubmittingExam ? "Submitting..." : "Submit Examination"}
              </button>
            </div>
          </div>

          {/* Submitted Result Overlay */}
          {examSubmittedResult ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 30 }}>
              <div className="card" style={{ maxWidth: 560, width: "100%", padding: 40, textAlign: "center" }}>
                <Award size={64} style={{ color: "#10b981", margin: "0 auto 16px" }} />
                <h2 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: 8, color: "var(--text-primary)" }}>
                  Examination Submitted Successfully!
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", marginBottom: 20 }}>
                  {examSubmittedResult.isAutoSubmitted
                    ? "Time expired. Your responses were automatically finalized and saved."
                    : "Your responses have been securely received and recorded."}
                </p>

                <div style={{
                  background: "var(--bg-secondary)",
                  borderRadius: 12,
                  padding: 20,
                  marginBottom: 24,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  textAlign: "left",
                }}>
                  <div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>Objective Score (Auto-Graded)</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "#10b981" }}>
                      {examSubmittedResult.objectiveScore} Marks
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>Subjective Status</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 600, color: examSubmittedResult.subjectivePendingCount > 0 ? "#f59e0b" : "#10b981" }}>
                      {examSubmittedResult.subjectivePendingCount > 0
                        ? `${examSubmittedResult.subjectivePendingCount} In Manual Review Queue`
                        : "Fully Graded"}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveExamSession(null);
                    setExamSubmittedResult(null);
                    fetchData();
                  }}
                  style={{
                    background: "var(--text-primary)",
                    color: "var(--bg-primary)",
                    border: "none",
                    padding: "12px 28px",
                    borderRadius: 8,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Return to Exams Hub
                </button>
              </div>
            </div>
          ) : (
            /* Main Exam Interface */
            <div className="player-main">
              <div className="player-content">
                {currentExamQuestion && (
                  <div className="player-question-card">
                    {/* Header with Type & Marks */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                          background: "var(--bg-secondary)",
                          color: "var(--text-primary)",
                          padding: "4px 12px",
                          borderRadius: 6,
                          fontWeight: 700,
                          fontSize: "0.85rem",
                        }}>
                          Question {activeQuestionIndex + 1} of {activeExamSession.questions.length}
                        </span>

                        <span className="qb-type-badge" style={{
                          background: Q_TYPE_COLORS[currentExamQuestion.questionType]?.bg || "var(--bg-secondary)",
                          color: Q_TYPE_COLORS[currentExamQuestion.questionType]?.color || "var(--text-primary)",
                        }}>
                          {Q_TYPE_COLORS[currentExamQuestion.questionType]?.label || currentExamQuestion.questionType}
                        </span>

                        <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                          {currentExamQuestion.topic}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#6366f1" }}>
                          [{currentExamQuestion.marks} Marks]
                        </span>

                        <button
                          onClick={() => toggleFlagQuestion(currentExamQuestion.id)}
                          style={{
                            background: flaggedQuestions.has(currentExamQuestion.id) ? "rgba(245, 158, 11, 0.15)" : "var(--bg-secondary)",
                            color: flaggedQuestions.has(currentExamQuestion.id) ? "#d97706" : "var(--text-secondary)",
                            border: "1px solid var(--border-primary)",
                            padding: "6px 12px",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: "0.8rem",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            fontWeight: 500,
                          }}
                        >
                          <Flag size={14} />
                          {flaggedQuestions.has(currentExamQuestion.id) ? "Flagged" : "Flag for Review"}
                        </button>
                      </div>
                    </div>

                    {/* Question Prompt */}
                    <div style={{ fontSize: "1.08rem", fontWeight: 500, color: "var(--text-primary)", lineHeight: 1.6, marginBottom: 24 }}>
                      {currentExamQuestion.questionText}
                    </div>

                    {/* Question Inputs tailored to type */}
                    {currentExamQuestion.questionType === "mcq" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {Array.isArray(currentExamQuestion.options) && currentExamQuestion.options.map((opt: string, oIdx: number) => {
                          const isSelected = studentAnswers[currentExamQuestion.id] === opt;
                          return (
                            <label
                              key={oIdx}
                              onClick={() => setStudentAnswers({ ...studentAnswers, [currentExamQuestion.id]: opt })}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 14,
                                padding: "14px 18px",
                                borderRadius: 10,
                                cursor: "pointer",
                                border: `2px solid ${isSelected ? "#6366f1" : "var(--border-primary)"}`,
                                background: isSelected ? "rgba(99, 102, 241, 0.08)" : "var(--bg-secondary)",
                                transition: "all 0.15s ease",
                              }}
                            >
                              <span style={{
                                width: 24,
                                height: 24,
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: `2px solid ${isSelected ? "#6366f1" : "var(--text-tertiary)"}`,
                                background: isSelected ? "#6366f1" : "transparent",
                                color: isSelected ? "#fff" : "var(--text-secondary)",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                              }}>
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span style={{ fontSize: "0.95rem", color: "var(--text-primary)" }}>{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {currentExamQuestion.questionType === "numerical" && (
                      <div style={{ background: "var(--bg-secondary)", padding: 20, borderRadius: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                        <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Your Numerical Answer:</label>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <input
                            type="number"
                            step="any"
                            placeholder="e.g. 18 or 0.8"
                            value={studentAnswers[currentExamQuestion.id] || ""}
                            onChange={(e) => setStudentAnswers({ ...studentAnswers, [currentExamQuestion.id]: e.target.value })}
                            style={{
                              padding: 12,
                              borderRadius: 8,
                              border: "1px solid var(--border-primary)",
                              background: "var(--bg-primary)",
                              color: "var(--text-primary)",
                              fontSize: "1rem",
                              width: 200,
                            }}
                          />
                          {currentExamQuestion.unit && (
                            <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                              {currentExamQuestion.unit}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {(currentExamQuestion.questionType === "short_answer" || currentExamQuestion.questionType === "essay") && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {currentExamQuestion.rubricCriteria && (
                          <div className="rubric-eval-box">
                            <strong>Assessment Criteria Guidelines: </strong>
                            {Array.isArray(currentExamQuestion.rubricCriteria)
                              ? currentExamQuestion.rubricCriteria.join("; ")
                              : currentExamQuestion.rubricCriteria}
                          </div>
                        )}

                        <textarea
                          rows={currentExamQuestion.questionType === "essay" ? 8 : 4}
                          placeholder="Type your complete solution or explanation here..."
                          value={studentAnswers[currentExamQuestion.id] || ""}
                          onChange={(e) => setStudentAnswers({ ...studentAnswers, [currentExamQuestion.id]: e.target.value })}
                          style={{
                            padding: 14,
                            borderRadius: 10,
                            border: "1px solid var(--border-primary)",
                            background: "var(--bg-secondary)",
                            color: "var(--text-primary)",
                            fontSize: "0.95rem",
                            lineHeight: 1.6,
                            fontFamily: "inherit",
                          }}
                        />

                        <div style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", textAlign: "right" }}>
                          Words: {(studentAnswers[currentExamQuestion.id] || "").trim().split(/\s+/).filter(Boolean).length}
                        </div>
                      </div>
                    )}

                    {/* Navigation Buttons Footer */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28, paddingTop: 16, borderTop: "1px solid var(--border-primary)" }}>
                      <button
                        onClick={() => setActiveQuestionIndex((prev) => Math.max(0, prev - 1))}
                        disabled={activeQuestionIndex === 0}
                        style={{
                          background: "var(--bg-secondary)",
                          color: "var(--text-primary)",
                          border: "1px solid var(--border-primary)",
                          padding: "10px 18px",
                          borderRadius: 8,
                          cursor: activeQuestionIndex === 0 ? "not-allowed" : "pointer",
                          opacity: activeQuestionIndex === 0 ? 0.5 : 1,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontWeight: 500,
                        }}
                      >
                        <ChevronLeft size={16} /> Previous Question
                      </button>

                      <div style={{ display: "flex", gap: 10 }}>
                        <button
                          onClick={() => {
                            const updated = { ...studentAnswers };
                            delete updated[currentExamQuestion.id];
                            setStudentAnswers(updated);
                          }}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--text-tertiary)",
                            cursor: "pointer",
                            fontSize: "0.82rem",
                          }}
                        >
                          Clear Response
                        </button>

                        <button
                          onClick={() => {
                            if (activeQuestionIndex < activeExamSession.questions.length - 1) {
                              setActiveQuestionIndex((prev) => prev + 1);
                            } else {
                              if (confirm("You are at the final question. Ready to submit?")) {
                                handleSubmitOnlineExam(false);
                              }
                            }
                          }}
                          style={{
                            background: "var(--text-primary)",
                            color: "var(--bg-primary)",
                            border: "none",
                            padding: "10px 22px",
                            borderRadius: 8,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontWeight: 600,
                          }}
                        >
                          {activeQuestionIndex < activeExamSession.questions.length - 1 ? (
                            <>Next Question <ChevronRight size={16} /></>
                          ) : (
                            <>Review & Submit</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Question Palette Sidebar */}
              <div className="player-sidebar">
                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  Question Palette
                </h4>
                <div style={{ display: "flex", gap: 12, fontSize: "0.76rem", color: "var(--text-secondary)", flexWrap: "wrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: "#10b981" }} /> Answered
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: "#f59e0b" }} /> Flagged
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--border-primary)" }} /> Unanswered
                  </span>
                </div>

                <div className="palette-grid">
                  {activeExamSession.questions.map((q: any, idx: number) => {
                    const isAnswered = studentAnswers[q.id] !== undefined && studentAnswers[q.id] !== "";
                    const isFlagged = flaggedQuestions.has(q.id);
                    const isCurrent = activeQuestionIndex === idx;

                    let statusClass = "";
                    if (isFlagged) statusClass = "flagged";
                    else if (isAnswered) statusClass = "answered";
                    if (isCurrent) statusClass += " active";

                    return (
                      <button
                        key={q.id}
                        className={`palette-btn ${statusClass}`}
                        onClick={() => setActiveQuestionIndex(idx)}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                <div style={{ marginTop: "auto", borderTop: "1px solid var(--border-primary)", paddingTop: 16 }}>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 8 }}>
                    <strong>Allowed:</strong> {activeExamSession.allowedMaterials || "None"}
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("Submit examination now?")) {
                        handleSubmitOnlineExam(false);
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: 8,
                      border: "none",
                      background: "var(--accent-primary)",
                      color: "#fff",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontSize: "0.85rem",
                    }}
                  >
                    Finish & Submit
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Cheating Warning Modal */}
          {showCheatingWarning && (
            <div className="cheating-warning-modal">
              <div className="cheating-box">
                <AlertOctagon size={48} style={{ color: "#ef4444", margin: "0 auto 16px" }} />
                <h3 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#ef4444", marginBottom: 8 }}>
                  Security Integrity Violation
                </h3>
                <p style={{ color: "var(--text-primary)", fontSize: "0.92rem", lineHeight: 1.5, marginBottom: 20 }}>
                  {cheatingMessage}
                </p>
                <div style={{ fontSize: "0.8rem", color: "var(--text-tertiary)", marginBottom: 20 }}>
                  All tab switching, clipboard events, and window blur incidents are timestamped and reviewed by the academic faculty examiner.
                </div>
                <button
                  onClick={() => setShowCheatingWarning(false)}
                  style={{
                    background: "#ef4444",
                    color: "#fff",
                    border: "none",
                    padding: "10px 24px",
                    borderRadius: 8,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  I Understand & Resume Examination
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          MANUAL GRADING DRAWER / EVALUATION MODAL (FR-EXAM-02)
         ════════════════════════════════════════════════════════════ */}
      {gradingAttempt && (
        <div className="modal-overlay">
          <div className="modal-dialog" style={{ maxWidth: 860, maxHeight: "92vh" }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">
                  Grade Submission: {gradingAttempt.studentName} ({gradingAttempt.studentId})
                </h3>
                <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                  {gradingAttempt.examTitle} · Auto-Graded Objective: {gradingAttempt.objectiveScore} marks
                </div>
              </div>
              <button onClick={() => setGradingAttempt(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* Anti-Cheating Incident Log Summary */}
              {gradingAttempt.violationsLog && gradingAttempt.violationsLog.length > 0 && (
                <div style={{
                  background: "rgba(239, 68, 68, 0.08)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: 10,
                  padding: "12px 16px",
                }}>
                  <div style={{ fontWeight: 700, color: "#ef4444", fontSize: "0.85rem", marginBottom: 6 }}>
                    ⚠ Proctoring Security Audit ({gradingAttempt.violationsLog.length} Incidents):
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                    {gradingAttempt.violationsLog.map((v: any, idx: number) => (
                      <li key={idx}>
                        <strong>{v.type}:</strong> {v.message} ({new Date(v.timestamp).toLocaleTimeString()})
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Subjective Questions to Grade */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  Subjective Answers Review
                </h4>

                {Object.values(gradingAttempt.answers || {}).map((item: any, idx: number) => {
                  if (!item.isSubjective) {
                    // Show compact summary of auto-graded items
                    return (
                      <div key={idx} style={{
                        background: "var(--bg-secondary)",
                        padding: "10px 14px",
                        borderRadius: 8,
                        fontSize: "0.84rem",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}>
                        <div style={{ color: "var(--text-secondary)" }}>
                          <strong>Q{idx + 1} ({item.questionType.toUpperCase()}):</strong> {item.questionText.slice(0, 70)}...
                        </div>
                        <span style={{ color: item.isCorrect ? "#10b981" : "#ef4444", fontWeight: 700 }}>
                          {item.awardedMarks} / {item.maxMarks} Marks (Auto-Graded)
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div key={idx} className="grading-q-block">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.95rem" }}>
                          Q{idx + 1}. {item.questionText}
                        </div>
                        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#6366f1" }}>
                          [Max: {item.maxMarks} Marks]
                        </span>
                      </div>

                      {/* Student's Answer */}
                      <div style={{
                        background: "var(--bg-primary)",
                        padding: 14,
                        borderRadius: 8,
                        border: "1px solid var(--border-primary)",
                        fontSize: "0.9rem",
                        lineHeight: 1.6,
                      }}>
                        <strong style={{ color: "#6366f1", display: "block", marginBottom: 6 }}>Candidate Submission:</strong>
                        <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{item.studentAnswer || "No answer submitted."}</p>
                      </div>

                      {/* Model Answer & Rubric */}
                      <div style={{
                        background: "rgba(16, 185, 129, 0.05)",
                        border: "1px dashed rgba(16, 185, 129, 0.3)",
                        padding: "10px 14px",
                        borderRadius: 8,
                        fontSize: "0.82rem",
                        color: "var(--text-secondary)",
                      }}>
                        <strong style={{ color: "#10b981", display: "block", marginBottom: 4 }}>Model Solution / Rubric Guide:</strong>
                        <div>{item.correctAnswer}</div>
                        {item.rubricCriteria && (
                          <div style={{ marginTop: 4 }}>
                            <strong>Rubric Breakdown: </strong>
                            {Array.isArray(item.rubricCriteria) ? item.rubricCriteria.join("; ") : item.rubricCriteria}
                          </div>
                        )}
                      </div>

                      {/* Score Input & Inline Feedback */}
                      <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 12, alignItems: "center" }}>
                        <div>
                          <label style={{ fontSize: "0.78rem", fontWeight: 600, display: "block", marginBottom: 4 }}>
                            Awarded Marks (0-{item.maxMarks})
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={item.maxMarks}
                            value={gradingScores[item.questionId] ?? 0}
                            onChange={(e) => setGradingScores({ ...gradingScores, [item.questionId]: Number(e.target.value) })}
                            style={{
                              padding: 8,
                              borderRadius: 6,
                              border: "1px solid var(--border-primary)",
                              background: "var(--bg-primary)",
                              color: "var(--text-primary)",
                              width: "100%",
                              fontWeight: 700,
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: "0.78rem", fontWeight: 600, display: "block", marginBottom: 4 }}>
                            Inline Feedback & Examiner Commentary
                          </label>
                          <input
                            placeholder="Add targeted constructive notes for this answer..."
                            value={gradingFeedback[item.questionId] || ""}
                            onChange={(e) => setGradingFeedback({ ...gradingFeedback, [item.questionId]: e.target.value })}
                            style={{
                              padding: 8,
                              borderRadius: 6,
                              border: "1px solid var(--border-primary)",
                              background: "var(--bg-primary)",
                              color: "var(--text-primary)",
                              width: "100%",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* General Remarks */}
              <div>
                <label style={{ fontSize: "0.84rem", fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Overall Examiner Remarks & Feedback to Student
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide comprehensive performance summary and grade notes..."
                  value={generalRemarks}
                  onChange={(e) => setGeneralRemarks(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid var(--border-primary)",
                    background: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setGradingAttempt(null)}
                style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid var(--border-primary)", background: "transparent", cursor: "pointer", color: "var(--text-secondary)" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveGradeEvaluation}
                style={{ padding: "10px 22px", borderRadius: 8, border: "none", background: "var(--accent-primary)", color: "#fff", fontWeight: 600, cursor: "pointer" }}
              >
                Save & Finalize Evaluation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          SCHEDULE EXAM MODAL
         ════════════════════════════════════════════════════════════ */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3 className="modal-title">Schedule New Examination</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateExam}>
              <div className="modal-body">
                <div>
                  <label style={{ fontSize: "0.84rem", fontWeight: 600, marginBottom: 6, display: "block" }}>Exam Title</label>
                  <input
                    required
                    placeholder="e.g. CS301 Midterm Examination: Data Structures & Algorithms"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 14 }}>
                  <div>
                    <label style={{ fontSize: "0.84rem", fontWeight: 600, marginBottom: 6, display: "block" }}>Course Code</label>
                    <input
                      required
                      placeholder="e.g. CS301"
                      value={newCourseCode}
                      onChange={(e) => setNewCourseCode(e.target.value)}
                      style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.84rem", fontWeight: 600, marginBottom: 6, display: "block" }}>Course Name</label>
                    <input
                      required
                      placeholder="e.g. Data Structures & Algorithms"
                      value={newCourseName}
                      onChange={(e) => setNewCourseName(e.target.value)}
                      style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.84rem", fontWeight: 600, marginBottom: 6, display: "block" }}>Exam Type</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                      style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                    >
                      <option value="midterm">Midterm</option>
                      <option value="final">Final Exam</option>
                      <option value="quiz">Online Quiz</option>
                      <option value="practical">Practical / Lab</option>
                      <option value="assignment">Assessment</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={{ fontSize: "0.84rem", fontWeight: 600, marginBottom: 6, display: "block" }}>Date</label>
                    <input
                      required
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.84rem", fontWeight: 600, marginBottom: 6, display: "block" }}>Start Time</label>
                    <input
                      required
                      type="time"
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                      style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.84rem", fontWeight: 600, marginBottom: 6, display: "block" }}>Duration (Mins)</label>
                    <input
                      required
                      type="number"
                      value={newDuration}
                      onChange={(e) => setNewDuration(Number(e.target.value))}
                      style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.84rem", fontWeight: 600, marginBottom: 6, display: "block" }}>Total Marks</label>
                    <input
                      required
                      type="number"
                      value={newTotalMarks}
                      onChange={(e) => {
                        const tm = Number(e.target.value);
                        setNewTotalMarks(tm);
                        setNewPassingMarks(Math.round(tm * 0.4));
                      }}
                      style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={{ fontSize: "0.84rem", fontWeight: 600, marginBottom: 6, display: "block" }}>Examination Hall / Venue</label>
                    <select
                      value={newHallId}
                      onChange={(e) => setNewHallId(e.target.value)}
                      style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                    >
                      {halls.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} (Cap: {h.capacity} seats)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.84rem", fontWeight: 600, marginBottom: 6, display: "block" }}>Faculty Invigilator</label>
                    <select
                      value={newInvigilatorId}
                      onChange={(e) => setNewInvigilatorId(e.target.value)}
                      style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                    >
                      {invigilators.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.firstName} {inv.lastName} ({inv.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "0.84rem", fontWeight: 600, marginBottom: 6, display: "block" }}>Allowed Materials (Permitted Items)</label>
                  <input
                    placeholder="e.g. Non-programmable Scientific Calculator, 1 page handwritten cheat-sheet, Pens/Pencils"
                    value={newAllowedMaterials}
                    onChange={(e) => setNewAllowedMaterials(e.target.value)}
                    style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.84rem", fontWeight: 600, marginBottom: 6, display: "block" }}>Instructions & Candidate Guidelines</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Arrive 15 minutes prior to start time. Valid student photo ID required. Cell phones strictly prohibited."
                    value={newInstructions}
                    onChange={(e) => setNewInstructions(e.target.value)}
                    style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid var(--border-primary)", background: "transparent", cursor: "pointer", color: "var(--text-secondary)" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "10px 22px", borderRadius: 8, border: "none", background: "var(--accent-primary)", color: "#fff", fontWeight: 600, cursor: "pointer" }}
                >
                  Save & Publish Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          ADD QUESTION TO QUESTION BANK MODAL
         ════════════════════════════════════════════════════════════ */}
      {showAddQuestionModal && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3 className="modal-title">Add Question to Question Bank</h3>
              <button onClick={() => setShowAddQuestionModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddQuestion}>
              <div className="modal-body">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 14 }}>
                  <div>
                    <label style={{ fontSize: "0.84rem", fontWeight: 600, marginBottom: 6, display: "block" }}>Course Code</label>
                    <input
                      required
                      placeholder="e.g. CS301"
                      value={newQCourseCode}
                      onChange={(e) => setNewQCourseCode(e.target.value)}
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.84rem", fontWeight: 600, marginBottom: 6, display: "block" }}>Topic / Module</label>
                    <input
                      required
                      placeholder="e.g. Graph Algorithms, Dynamic Programming"
                      value={newQTopic}
                      onChange={(e) => setNewQTopic(e.target.value)}
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.84rem", fontWeight: 600, marginBottom: 6, display: "block" }}>Marks</label>
                    <input
                      required
                      type="number"
                      value={newQMarks}
                      onChange={(e) => setNewQMarks(Number(e.target.value))}
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={{ fontSize: "0.84rem", fontWeight: 600, marginBottom: 6, display: "block" }}>Question Type</label>
                    <select
                      value={newQType}
                      onChange={(e: any) => setNewQType(e.target.value)}
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                    >
                      <option value="mcq">MCQ (Multiple Choice)</option>
                      <option value="short_answer">Short Answer</option>
                      <option value="numerical">Numerical</option>
                      <option value="essay">Essay / Rubric</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.84rem", fontWeight: 600, marginBottom: 6, display: "block" }}>Difficulty</label>
                    <select
                      value={newQDifficulty}
                      onChange={(e: any) => setNewQDifficulty(e.target.value)}
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.84rem", fontWeight: 600, marginBottom: 6, display: "block" }}>Pool Name</label>
                    <input
                      placeholder="e.g. Midterm Pool - Algorithms"
                      value={newQPoolName}
                      onChange={(e) => setNewQPoolName(e.target.value)}
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "0.84rem", fontWeight: 600, marginBottom: 6, display: "block" }}>Question Statement</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Enter the full question prompt here..."
                    value={newQText}
                    onChange={(e) => setNewQText(e.target.value)}
                    style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                  />
                </div>

                {newQType === "mcq" && (
                  <div style={{ background: "var(--bg-secondary)", padding: 16, borderRadius: 10 }}>
                    <label style={{ fontSize: "0.84rem", fontWeight: 600, marginBottom: 10, display: "block" }}>
                      MCQ Options (Check radio for correct answer):
                    </label>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {newQOptions.map((opt, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <input
                            type="radio"
                            name="correctOpt"
                            checked={newQCorrectAnswer === opt && opt !== ""}
                            onChange={() => setNewQCorrectAnswer(opt)}
                          />
                          <input
                            required
                            placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                            value={opt}
                            onChange={(e) => {
                              const opts = [...newQOptions];
                              opts[idx] = e.target.value;
                              setNewQOptions(opts);
                            }}
                            style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid var(--border-primary)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {newQType === "short_answer" && (
                  <div>
                    <label style={{ fontSize: "0.84rem", fontWeight: 600, marginBottom: 6, display: "block" }}>Model Answer & Key Concepts</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Expected core key concepts or exact response..."
                      value={newQCorrectAnswer}
                      onChange={(e) => setNewQCorrectAnswer(e.target.value)}
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                    />
                  </div>
                )}

                {newQType === "numerical" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                    <div>
                      <label style={{ fontSize: "0.84rem", fontWeight: 600, marginBottom: 6, display: "block" }}>Exact Numeric Value</label>
                      <input
                        required
                        placeholder="e.g. 18 or 0.8"
                        value={newQCorrectAnswer}
                        onChange={(e) => setNewQCorrectAnswer(e.target.value)}
                        style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.84rem", fontWeight: 600, marginBottom: 6, display: "block" }}>Tolerance (±)</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="e.g. 0.05"
                        value={newQTolerance}
                        onChange={(e) => setNewQTolerance(Number(e.target.value))}
                        style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.84rem", fontWeight: 600, marginBottom: 6, display: "block" }}>Unit</label>
                      <input
                        placeholder="e.g. edges, m/s"
                        value={newQUnit}
                        onChange={(e) => setNewQUnit(e.target.value)}
                        style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                      />
                    </div>
                  </div>
                )}

                {newQType === "essay" && (
                  <div>
                    <label style={{ fontSize: "0.84rem", fontWeight: 600, marginBottom: 6, display: "block" }}>Grading Rubric Criteria (One per line)</label>
                    <textarea
                      rows={3}
                      value={newQRubricCriteria.join("\n")}
                      onChange={(e) => setNewQRubricCriteria(e.target.value.split("\n").filter((l) => l.trim()))}
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                    />
                  </div>
                )}

                <div>
                  <label style={{ fontSize: "0.84rem", fontWeight: 600, marginBottom: 6, display: "block" }}>Solution Explanation / Marking Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Step-by-step guidance for invigilators and graders..."
                    value={newQExplanation}
                    onChange={(e) => setNewQExplanation(e.target.value)}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowAddQuestionModal(false)}
                  style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid var(--border-primary)", background: "transparent", cursor: "pointer", color: "var(--text-secondary)" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "10px 22px", borderRadius: 8, border: "none", background: "var(--accent-primary)", color: "#fff", fontWeight: 600, cursor: "pointer" }}
                >
                  Add to Question Bank
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          FR-EXAM-03: OFFICIAL MARKSHEET CERTIFICATE MODAL
         ════════════════════════════════════════════════════════════ */}
      {showMarksheetModal && activeMarksheetData && (
        <div className="marksheet-modal-overlay">
          <div style={{ maxWidth: 880, width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Modal Actions Bar (hidden on print) */}
            <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(15, 23, 42, 0.9)", padding: "12px 20px", borderRadius: 12, color: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.9rem", fontWeight: 600 }}>
                <Award size={18} color="#10b981" />
                <span>Verified Examination Marksheet Certificate (PDF Ready)</span>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => window.print()}
                  style={{
                    background: "#6366f1",
                    color: "#fff",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: "0.84rem",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Printer size={15} /> Print / Export PDF
                </button>
                <button
                  onClick={() => setShowMarksheetModal(false)}
                  style={{
                    background: "rgba(255, 255, 255, 0.15)",
                    color: "#fff",
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: "0.84rem",
                  }}
                >
                  <X size={16} /> Close
                </button>
              </div>
            </div>

            {/* Official Marksheet Document Body */}
            <div className="marksheet-certificate">
              <div className="marksheet-watermark">AUTHENTIC</div>

              {/* Institution Seal & Header */}
              <div className="marksheet-header-seal">
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #4338ca 0%, #6366f1 100%)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.4rem",
                    fontWeight: 800,
                    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                  }}>
                    🎓
                  </div>
                  <div>
                    <h2 style={{ fontSize: "1.35rem", fontWeight: 800, letterSpacing: "1px", margin: 0, color: "#0f172a" }}>
                      {activeMarksheetData.institution || "SMART DIGITAL CAMPUS UNIVERSITY"}
                    </h2>
                    <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b", letterSpacing: "0.5px", textTransform: "uppercase", marginTop: 2 }}>
                      {activeMarksheetData.faculty || "DEPARTMENT OF ACADEMIC EXAMINATIONS & EVALUATION"}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "4px 10px",
                    background: "#ecfdf5",
                    border: "1px solid #10b981",
                    borderRadius: 20,
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    color: "#059669",
                  }}>
                    <ShieldCheck size={14} /> SECURE CRYPTOGRAPHICALLY VERIFIED
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: 4 }}>
                    Date: {new Date(activeMarksheetData.generatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </div>
                </div>
              </div>

              {/* Document Title */}
              <div style={{ textAlign: "center", margin: "20px 0 24px" }}>
                <h3 style={{
                  fontSize: "1.2rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                  color: "#1e293b",
                  borderBottom: "2px solid #e2e8f0",
                  paddingBottom: 8,
                  display: "inline-block",
                }}>
                  {activeMarksheetData.documentType}
                </h3>
              </div>

              {/* Candidate & Exam Metadata Grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                background: "#f8fafc",
                padding: "16px 20px",
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                fontSize: "0.86rem",
              }}>
                <div>
                  <div style={{ marginBottom: 6 }}>
                    <span style={{ color: "#64748b", fontWeight: 500 }}>Candidate Name: </span>
                    <strong style={{ color: "#0f172a" }}>{activeMarksheetData.student?.name}</strong>
                  </div>
                  <div style={{ marginBottom: 6 }}>
                    <span style={{ color: "#64748b", fontWeight: 500 }}>Student ID: </span>
                    <strong style={{ color: "#0f172a" }}>{activeMarksheetData.student?.id}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", fontWeight: 500 }}>Cohort Standing: </span>
                    <strong style={{ color: "#6366f1" }}>Rank {activeMarksheetData.performance?.cohortRank} ({activeMarksheetData.performance?.percentileRank} Percentile)</strong>
                  </div>
                </div>

                <div>
                  <div style={{ marginBottom: 6 }}>
                    <span style={{ color: "#64748b", fontWeight: 500 }}>Course: </span>
                    <strong style={{ color: "#0f172a" }}>{activeMarksheetData.exam?.courseCode} - {activeMarksheetData.exam?.courseName}</strong>
                  </div>
                  <div style={{ marginBottom: 6 }}>
                    <span style={{ color: "#64748b", fontWeight: 500 }}>Examination: </span>
                    <strong style={{ color: "#0f172a" }}>{activeMarksheetData.exam?.title} ({activeMarksheetData.exam?.type?.toUpperCase()})</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", fontWeight: 500 }}>Evaluation Status: </span>
                    <strong style={{ color: activeMarksheetData.performance?.isPassing ? "#059669" : "#dc2626" }}>
                      {activeMarksheetData.performance?.isPassing ? "QUALIFIED / PASSED" : "RE-EVALUATION REQUIRED"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Assessment Breakdown Table */}
              <table className="marksheet-table">
                <thead>
                  <tr>
                    <th>Subject / Component</th>
                    <th>Max Marks</th>
                    <th>Passing Marks</th>
                    <th>Raw Score</th>
                    <th>Grade Curve Adj.</th>
                    <th>Final Marks</th>
                    <th>Percentage</th>
                    <th>Grade</th>
                    <th>Grade Point</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>{activeMarksheetData.exam?.courseName}</strong> ({activeMarksheetData.exam?.title})</td>
                    <td>{activeMarksheetData.exam?.totalMarks}</td>
                    <td>{activeMarksheetData.exam?.passingMarks}</td>
                    <td>{activeMarksheetData.performance?.originalMarks !== null ? activeMarksheetData.performance?.originalMarks : activeMarksheetData.performance?.marksObtained}</td>
                    <td>
                      {activeMarksheetData.performance?.curveAdjustment ? (
                        <span style={{ color: "#059669", fontWeight: 700 }}>
                          +{activeMarksheetData.performance?.curveAdjustment}
                        </span>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>None</span>
                      )}
                    </td>
                    <td><strong style={{ fontSize: "1.05rem", color: "#4338ca" }}>{activeMarksheetData.performance?.marksObtained}</strong></td>
                    <td><strong>{activeMarksheetData.performance?.percentage}%</strong></td>
                    <td>
                      <span style={{
                        padding: "3px 10px",
                        borderRadius: 12,
                        fontWeight: 800,
                        fontSize: "0.88rem",
                        background: activeMarksheetData.performance?.grade?.startsWith("A") ? "#dcfce7" : "#e0e7ff",
                        color: activeMarksheetData.performance?.grade?.startsWith("A") ? "#166534" : "#3730a3",
                      }}>
                        {activeMarksheetData.performance?.grade}
                      </span>
                    </td>
                    <td><strong>{activeMarksheetData.performance?.gradePoint?.toFixed(1)}</strong></td>
                  </tr>
                </tbody>
              </table>

              {/* Curving Disclosure Note */}
              {activeMarksheetData.curvingApplied && (
                <div style={{
                  fontSize: "0.78rem",
                  color: "#64748b",
                  background: "#f1f5f9",
                  padding: "8px 14px",
                  borderRadius: 6,
                  borderLeft: "3px solid #6366f1",
                  margin: "12px 0",
                }}>
                  ℹ️ <strong>Curvature Disclosure:</strong> Scores in this examination include faculty-authorized statistical curving ({activeMarksheetData.curveMethod || "Standard Moderation Curve"}). Both raw and curved marks are logged in academic records.
                </div>
              )}

              {/* Cryptographic Signature & Verification Seal Block */}
              <div className="marksheet-sig-block">
                {/* QR Code & Digest */}
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 72,
                    height: 72,
                    background: "#0f172a",
                    padding: 6,
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    textAlign: "center",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    lineHeight: 1.2,
                  }}>
                    SCAN TO VERIFY<br />🏛️<br />SDMS
                  </div>
                  <div>
                    <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "#0f172a", textTransform: "uppercase" }}>
                      Cryptographic Authenticity Digest
                    </div>
                    <div style={{
                      fontFamily: "monospace",
                      fontSize: "0.68rem",
                      color: "#64748b",
                      wordBreak: "break-all",
                      maxWidth: 280,
                      marginTop: 2,
                    }}>
                      SHA-256: {activeMarksheetData.verificationHash}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#10b981", fontWeight: 600, marginTop: 4 }}>
                      ✓ Digitally Certified by SDMS Examination Board
                    </div>
                  </div>
                </div>

                {/* Dual Signatures */}
                <div style={{ display: "flex", gap: 32, textAlign: "center" }}>
                  <div>
                    <div style={{ fontFamily: "serif", fontStyle: "italic", fontSize: "1.1rem", color: "#334155", marginBottom: 2 }}>
                      Dr. Ronald H. Sterling
                    </div>
                    <div style={{ borderTop: "1.5px solid #0f172a", paddingTop: 4, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "#0f172a" }}>
                      Controller of Examinations
                    </div>
                  </div>

                  <div>
                    <div style={{ fontFamily: "serif", fontStyle: "italic", fontSize: "1.1rem", color: "#334155", marginBottom: 2 }}>
                      Prof. Marcus Vance, Ph.D.
                    </div>
                    <div style={{ borderTop: "1.5px solid #0f172a", paddingTop: 4, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "#0f172a" }}>
                      Dean of Academic Affairs
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          FR-EXAM-03: CUMULATIVE ACADEMIC TRANSCRIPT MODAL
         ════════════════════════════════════════════════════════════ */}
      {showTranscriptModal && activeTranscriptData && (
        <div className="marksheet-modal-overlay">
          <div style={{ maxWidth: 920, width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Modal Actions Bar (hidden on print) */}
            <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(15, 23, 42, 0.9)", padding: "12px 20px", borderRadius: 12, color: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.9rem", fontWeight: 600 }}>
                <FileText size={18} color="#06b6d4" />
                <span>Official Cumulative Academic Transcript & CGPA Record</span>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => window.print()}
                  style={{
                    background: "#06b6d4",
                    color: "#fff",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: "0.84rem",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Printer size={15} /> Print / Export PDF
                </button>
                <button
                  onClick={() => setShowTranscriptModal(false)}
                  style={{
                    background: "rgba(255, 255, 255, 0.15)",
                    color: "#fff",
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: "0.84rem",
                  }}
                >
                  <X size={16} /> Close
                </button>
              </div>
            </div>

            {/* Official Cumulative Transcript Body */}
            <div className="marksheet-certificate">
              <div className="marksheet-watermark">TRANSCRIPT</div>

              {/* Institution Seal & Header */}
              <div className="marksheet-header-seal">
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.4rem",
                    fontWeight: 800,
                    boxShadow: "0 4px 12px rgba(6, 182, 212, 0.3)",
                  }}>
                    🏛️
                  </div>
                  <div>
                    <h2 style={{ fontSize: "1.35rem", fontWeight: 800, letterSpacing: "1px", margin: 0, color: "#0f172a" }}>
                      {activeTranscriptData.institution || "SMART DIGITAL CAMPUS UNIVERSITY"}
                    </h2>
                    <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b", letterSpacing: "0.5px", textTransform: "uppercase", marginTop: 2 }}>
                      OFFICE OF THE UNIVERSITY REGISTRAR & ACADEMIC RECORDS
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "4px 10px",
                    background: "#ecfeff",
                    border: "1px solid #06b6d4",
                    borderRadius: 20,
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    color: "#0891b2",
                  }}>
                    <ShieldCheck size={14} /> OFFICIAL ACADEMIC TRANSCRIPT
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: 4 }}>
                    Issued: {new Date(activeTranscriptData.generatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </div>
                </div>
              </div>

              {/* Student Metadata Card */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1.5fr 1fr",
                gap: 16,
                background: "#f8fafc",
                padding: "16px 20px",
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                fontSize: "0.86rem",
                marginBottom: 20,
              }}>
                <div>
                  <div style={{ marginBottom: 6 }}>
                    <span style={{ color: "#64748b" }}>Student Full Name: </span>
                    <strong style={{ color: "#0f172a" }}>{activeTranscriptData.student?.name}</strong>
                  </div>
                  <div style={{ marginBottom: 6 }}>
                    <span style={{ color: "#64748b" }}>Matriculation / Student ID: </span>
                    <strong style={{ color: "#0f172a" }}>{activeTranscriptData.student?.id}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>Email: </span>
                    <span style={{ color: "#0f172a" }}>{activeTranscriptData.student?.email}</span>
                  </div>
                </div>

                <div>
                  <div style={{ marginBottom: 6 }}>
                    <span style={{ color: "#64748b" }}>Academic Standing: </span>
                    <strong style={{ color: "#059669" }}>{activeTranscriptData.summary?.academicStanding}</strong>
                  </div>
                  <div style={{ marginBottom: 6 }}>
                    <span style={{ color: "#64748b" }}>Credits Completed: </span>
                    <strong>{activeTranscriptData.summary?.totalCreditsEarned} / {activeTranscriptData.summary?.totalCreditsAttempted} Credits</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>Cumulative GPA (CGPA): </span>
                    <strong style={{ fontSize: "1.1rem", color: "#0284c7" }}>{activeTranscriptData.summary?.cumulativeGPA?.toFixed(2)} / 4.00</strong>
                  </div>
                </div>
              </div>

              {/* Cumulative Course Records Table */}
              <table className="marksheet-table">
                <thead>
                  <tr>
                    <th>Course Code</th>
                    <th>Course Title & Assessment</th>
                    <th>Credits</th>
                    <th>Score</th>
                    <th>%</th>
                    <th>Grade</th>
                    <th>Grade Point</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTranscriptData.courseRecords?.map((rec: any, idx: number) => (
                    <tr key={idx}>
                      <td><strong>{rec.courseCode}</strong></td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{rec.courseName}</div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{rec.examTitle} ({rec.term})</div>
                      </td>
                      <td>{rec.credits || 3}</td>
                      <td><strong>{rec.marksObtained}</strong> / {rec.totalMarks}</td>
                      <td>{rec.percentage}%</td>
                      <td>
                        <span style={{
                          padding: "2px 8px",
                          borderRadius: 10,
                          fontWeight: 700,
                          fontSize: "0.8rem",
                          background: rec.grade?.startsWith("A") ? "#dcfce7" : "#e0e7ff",
                          color: rec.grade?.startsWith("A") ? "#166534" : "#3730a3",
                        }}>
                          {rec.grade}
                        </span>
                      </td>
                      <td><strong>{rec.gradePoint?.toFixed(1)}</strong></td>
                      <td>
                        <span style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: rec.status === "COMPLETED" ? "#059669" : "#dc2626",
                        }}>
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* 3 Summary KPI Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, margin: "24px 0" }}>
                <div style={{ background: "#f8fafc", padding: "14px 18px", borderRadius: 8, border: "1px solid #e2e8f0", textAlign: "center" }}>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Courses Attempted</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a" }}>
                    {activeTranscriptData.summary?.totalCoursesAttempted} Courses
                  </div>
                </div>

                <div style={{ background: "#f8fafc", padding: "14px 18px", borderRadius: 8, border: "1px solid #e2e8f0", textAlign: "center" }}>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Courses Passed</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#059669" }}>
                    {activeTranscriptData.summary?.totalCoursesPassed} of {activeTranscriptData.summary?.totalCoursesAttempted}
                  </div>
                </div>

                <div style={{ background: "#f0fdfa", padding: "14px 18px", borderRadius: 8, border: "1px solid #99f6e4", textAlign: "center" }}>
                  <div style={{ fontSize: "0.75rem", color: "#0f766e", textTransform: "uppercase", fontWeight: 600 }}>Cumulative CGPA</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0d9488" }}>
                    {activeTranscriptData.summary?.cumulativeGPA?.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Verification & Registrar Signature */}
              <div className="marksheet-sig-block">
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 72,
                    height: 72,
                    background: "#0891b2",
                    padding: 6,
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    textAlign: "center",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    lineHeight: 1.2,
                  }}>
                    TRANSCRIPT<br />VERIFIED<br />🏛️
                  </div>
                  <div>
                    <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "#0f172a", textTransform: "uppercase" }}>
                      Institutional Verification Digest
                    </div>
                    <div style={{
                      fontFamily: "monospace",
                      fontSize: "0.68rem",
                      color: "#64748b",
                      wordBreak: "break-all",
                      maxWidth: 280,
                      marginTop: 2,
                    }}>
                      SHA-256: {activeTranscriptData.verificationHash}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#0891b2", fontWeight: 600, marginTop: 4 }}>
                      Recorded in Central Academic Ledger
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "serif", fontStyle: "italic", fontSize: "1.1rem", color: "#334155", marginBottom: 2 }}>
                    Eleanor G. Thornton, LL.D.
                  </div>
                  <div style={{ borderTop: "1.5px solid #0f172a", paddingTop: 4, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "#0f172a" }}>
                    University Registrar
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
